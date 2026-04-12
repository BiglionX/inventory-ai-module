from fastapi import FastAPI, HTTPException, Depends, Header
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
import pandas as pd
from prophet import Prophet
import logging
import time
from datetime import datetime, timedelta
import hashlib
import json

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Inventory Prediction API", version="1.0.0")

# 简单的内存缓存(生产环境应使用Redis)
cache = {}
CACHE_TTL = 3600  # 缓存1小时

class SalesDataPoint(BaseModel):
    date: str
    quantity: int

class PredictionRequest(BaseModel):
    item_id: str
    historical_data: List[SalesDataPoint]
    forecast_days: int = 30

class PredictionResponse(BaseModel):
    item_id: str
    predictions: List[dict]
    model_version: str

class BatchPredictionRequest(BaseModel):
    """批量预测请求"""
    items: List[PredictionRequest]

class BatchPredictionResponse(BaseModel):
    """批量预测响应"""
    results: List[PredictionResponse]
    total_items: int
    success_count: int
    failed_count: int

class TrainingRequest(BaseModel):
    """模型训练请求"""
    item_id: str
    historical_data: List[SalesDataPoint]
    retrain: bool = False

class TrainingResponse(BaseModel):
    """模型训练响应"""
    item_id: str
    status: str
    message: str
    training_time_ms: Optional[int] = None

def generate_cache_key(item_id: str, forecast_days: int, data_hash: str) -> str:
    """生成缓存键"""
    return f"{item_id}_{forecast_days}_{data_hash}"

def get_from_cache(key: str) -> Optional[dict]:
    """从缓存获取数据"""
    if key in cache:
        cached_data, timestamp = cache[key]
        if time.time() - timestamp < CACHE_TTL:
            logger.info(f"Cache hit for key: {key}")
            return cached_data
        else:
            del cache[key]
    return None

def set_cache(key: str, data: dict):
    """设置缓存"""
    cache[key] = (data, time.time())
    logger.info(f"Cache set for key: {key}")

@app.post("/predict", response_model=PredictionResponse)
async def predict_sales(request: PredictionRequest):
    """基于历史销售数据预测未来销量"""
    start_time = time.time()
    try:
        # 生成缓存键
        data_str = json.dumps([p.dict() for p in request.historical_data], sort_keys=True)
        data_hash = hashlib.md5(data_str.encode()).hexdigest()[:8]
        cache_key = generate_cache_key(request.item_id, request.forecast_days, data_hash)

        # 检查缓存
        cached_result = get_from_cache(cache_key)
        if cached_result:
            return PredictionResponse(**cached_result)

        logger.info(f"Starting prediction for item {request.item_id}")

        # 1. 数据预处理
        df = pd.DataFrame([
            {"ds": point.date, "y": point.quantity}
            for point in request.historical_data
        ])
        df["ds"] = pd.to_datetime(df["ds"])

        # 2. 训练 Prophet 模型
        model = Prophet(interval_width=0.95, yearly_seasonality=True)
        model.fit(df)

        # 3. 生成预测
        future = model.make_future_dataframe(periods=request.forecast_days)
        forecast = model.predict(future)

        # 4. 格式化返回结果
        predictions = []
        for _, row in forecast.tail(request.forecast_days).iterrows():
            predictions.append({
                "date": row["ds"].strftime("%Y-%m-%d"),
                "predicted_quantity": int(row["yhat"]),
                "lower_bound": int(row["yhat_lower"]),
                "upper_bound": int(row["yhat_upper"])
            })

        result = PredictionResponse(
            item_id=request.item_id,
            predictions=predictions,
            model_version="prophet-1.1.5"
        )

        # 5. 缓存结果
        set_cache(cache_key, result.dict())

        execution_time = (time.time() - start_time) * 1000
        logger.info(f"Prediction completed for {request.item_id} in {execution_time:.2f}ms")

        return result

    except Exception as e:
        logger.error(f"Prediction failed for {request.item_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "prediction-api"}

@app.post("/predict/batch", response_model=BatchPredictionResponse)
async def batch_predict(request: BatchPredictionRequest):
    """批量预测多个商品销量"""
    start_time = time.time()
    results = []
    success_count = 0
    failed_count = 0

    logger.info(f"Starting batch prediction for {len(request.items)} items")

    for item_request in request.items:
        try:
            # 调用单个预测逻辑
            result = await predict_sales(item_request)
            results.append(result)
            success_count += 1
        except Exception as e:
            logger.error(f"Failed to predict for item {item_request.item_id}: {str(e)}")
            failed_count += 1

    total_time = (time.time() - start_time) * 1000
    logger.info(f"Batch prediction completed: {success_count} succeeded, {failed_count} failed in {total_time:.2f}ms")

    return BatchPredictionResponse(
        results=results,
        total_items=len(request.items),
        success_count=success_count,
        failed_count=failed_count
    )

@app.get("/predict/{item_id}/history")
async def get_prediction_history(item_id: str, limit: int = 30):
    """获取历史预测记录(模拟,实际应从数据库读取)"""
    # 这里返回空列表,实际实现应查询数据库
    logger.info(f"Fetching prediction history for item {item_id}")
    return {
        "item_id": item_id,
        "history": [],
        "message": "History retrieval requires database integration"
    }

@app.post("/train", response_model=TrainingResponse)
async def train_model(request: TrainingRequest):
    """手动触发模型重新训练"""
    start_time = time.time()
    try:
        logger.info(f"Starting model training for item {request.item_id}")

        # 数据预处理
        df = pd.DataFrame([
            {"ds": point.date, "y": point.quantity}
            for point in request.historical_data
        ])
        df["ds"] = pd.to_datetime(df["ds"])

        # 训练模型
        model = Prophet(interval_width=0.95, yearly_seasonality=True)
        model.fit(df)

        training_time = int((time.time() - start_time) * 1000)
        logger.info(f"Model training completed for {request.item_id} in {training_time}ms")

        return TrainingResponse(
            item_id=request.item_id,
            status="success",
            message="Model trained successfully",
            training_time_ms=training_time
        )
    except Exception as e:
        logger.error(f"Model training failed for {request.item_id}: {str(e)}")
        return TrainingResponse(
            item_id=request.item_id,
            status="failed",
            message=str(e)
        )

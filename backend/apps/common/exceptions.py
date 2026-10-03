"""Error envelope: every API error is {"detail": ..., "errors": {...}}."""
from rest_framework.views import exception_handler as drf_exception_handler


def exception_handler(exc, context):
    response = drf_exception_handler(exc, context)
    if response is None:
        return None
    data = response.data
    if isinstance(data, dict) and "detail" in data and "errors" in data:
        return response
    if isinstance(data, dict) and "detail" in data:
        errors = {k: v for k, v in data.items() if k != "detail"}
        response.data = {"detail": data["detail"], "errors": errors}
    elif isinstance(data, dict):
        response.data = {"detail": "Validation error.", "errors": data}
    elif isinstance(data, list):
        response.data = {"detail": data[0] if data else "Error.", "errors": {}}
    else:
        response.data = {"detail": str(data), "errors": {}}
    return response

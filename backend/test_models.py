import typing
try:

    _orig_eval_type = typing._eval_type
    def _patched_eval_type(*args, **kwargs):
        kwargs.pop('prefer_fwd_module', None)
        return _orig_eval_type(*args, **kwargs)
    typing._eval_type = _patched_eval_type
except AttributeError:
    pass


from sql_models import User

print("User model loaded successfully")
from sql_models import Product
print("Product model loaded successfully")

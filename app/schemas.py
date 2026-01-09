from pydantic import BaseModel, field_validator
import re
import ipaddress
from typing import List, Optional

# Regex for basic structure checking of RD/RT (ASN:NN or IP:NN)
# We allow alphanumeric for ASN/IP part just to capture IP format or simple numbers.
# A stricter regex or logic could be applied.
RD_RT_PATTERN = r'^([0-9]+|((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)):([0-9]+)$'

class RouteTargetSchema(BaseModel):
    rt: str

    @field_validator('rt')
    @classmethod
    def validate_rt(cls, v):
        if not re.match(RD_RT_PATTERN, v):
             raise ValueError('Invalid RT format. Expected ASN:NN or IP:NN (e.g., 65000:100 or 192.168.1.1:100)')
        return v

class PrefixSchema(BaseModel):
    cidr: str

    @field_validator('cidr')
    @classmethod
    def validate_cidr(cls, v):
        try:
            ipaddress.ip_network(v, strict=False)
        except ValueError:
            raise ValueError('Invalid CIDR format')
        return v

class VRFCreate(BaseModel):
    name: str
    namespace: str = "default"
    rd: str

    @field_validator('rd')
    @classmethod
    def validate_rd(cls, v):
        if not re.match(RD_RT_PATTERN, v):
             raise ValueError('Invalid RD format. Expected ASN:NN or IP:NN (e.g., 65000:100 or 192.168.1.1:100)')
        return v

class VRFResponse(BaseModel):
    name: str
    namespace: str
    rd: str
    imports: List[str] = []
    exports: List[str] = []
    prefixes: List[str] = []

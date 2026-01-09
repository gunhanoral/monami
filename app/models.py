from neomodel import (
    StructuredNode,
    StringProperty,
    RelationshipTo,
    RelationshipFrom
)

class RouteTarget(StructuredNode):
    rt = StringProperty(unique_index=True, required=True)

class VRF(StructuredNode):
    name = StringProperty(required=True, index=True)
    namespace = StringProperty(required=True, index=True)
    rd = StringProperty(unique_index=True, required=True)

    # Relationships
    imports = RelationshipTo('RouteTarget', 'IMPORTS')
    exports = RelationshipTo('RouteTarget', 'EXPORTS')
    
    # We define the relationship here as well for convenience, 
    # matching the direction from Prefix -> VRF (BELONGS_TO)
    prefixes = RelationshipFrom('Prefix', 'BELONGS_TO')

class Prefix(StructuredNode):
    cidr = StringProperty(required=True)
    
    # Relationship to VRF
    vrf = RelationshipTo('VRF', 'BELONGS_TO')

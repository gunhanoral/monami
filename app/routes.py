from fastapi import APIRouter, HTTPException, Query
from app.models import VRF, RouteTarget, Prefix
from app.schemas import VRFCreate, VRFResponse, RouteTargetSchema, PrefixSchema


router = APIRouter()

@router.post("/vrfs/", response_model=VRFResponse)
def create_vrf(vrf_in: VRFCreate):
    # Check if VRF exists with same namespace and name
    existing = VRF.nodes.first_or_none(namespace=vrf_in.namespace, name=vrf_in.name)
    if existing:
        raise HTTPException(status_code=400, detail=f"VRF '{vrf_in.name}' already exists in namespace '{vrf_in.namespace}'")
    
    # Check if RD is unique globally (if not enforced by constraint yet, though we set unique_index=True in model)
    existing_rd = VRF.nodes.first_or_none(rd=vrf_in.rd)
    if existing_rd:
        raise HTTPException(status_code=400, detail=f"RD '{vrf_in.rd}' is already in use")

    vrf = VRF(
        name=vrf_in.name,
        namespace=vrf_in.namespace,
        rd=vrf_in.rd
    ).save()
    
    return VRFResponse(
        name=vrf.name,
        namespace=vrf.namespace,
        rd=vrf.rd
    )

@router.get("/vrfs/", response_model=list[VRFResponse])
def list_vrfs(namespace: str = Query(None)):
    if namespace:
        vrfs = VRF.nodes.filter(namespace=namespace)
    else:
        vrfs = VRF.nodes.all()
    
    results = []
    for vrf in vrfs:
        results.append(VRFResponse(
            name=vrf.name,
            namespace=vrf.namespace,
            rd=vrf.rd,
            imports=[rt.rt for rt in vrf.imports],
            exports=[rt.rt for rt in vrf.exports],
            prefixes=[p.cidr for p in vrf.prefixes]
        ))
    return results

@router.get("/vrfs/{namespace}/{name}", response_model=VRFResponse)
def get_vrf(namespace: str, name: str):
    vrf = VRF.nodes.first_or_none(namespace=namespace, name=name)
    if not vrf:
        raise HTTPException(status_code=404, detail="VRF not found")
    
    return VRFResponse(
        name=vrf.name,
        namespace=vrf.namespace,
        rd=vrf.rd,
        imports=[rt.rt for rt in vrf.imports],
        exports=[rt.rt for rt in vrf.exports],
        prefixes=[p.cidr for p in vrf.prefixes]
    )

@router.delete("/vrfs/{namespace}/{name}")
def delete_vrf(namespace: str, name: str):
    vrf = VRF.nodes.first_or_none(namespace=namespace, name=name)
    if not vrf:
        raise HTTPException(status_code=404, detail="VRF not found")
    
    # Optional: Delete prefixes associated with this VRF if they are exclusive?
    # Our model says Prefix -> BELONGS_TO -> VRF.
    # We should probably delete the prefixes.
    for p in vrf.prefixes:
        p.delete()
        
    vrf.delete()
    return {"message": "VRF deleted"}

# Route Targets

@router.post("/vrfs/{namespace}/{name}/targets/import")
def add_import_rt(namespace: str, name: str, rt_in: RouteTargetSchema):
    vrf = VRF.nodes.first_or_none(namespace=namespace, name=name)
    if not vrf:
        raise HTTPException(status_code=404, detail="VRF not found")
    
    rt_node = RouteTarget.nodes.first_or_none(rt=rt_in.rt)
    if not rt_node:
        rt_node = RouteTarget(rt=rt_in.rt).save()
    
    if not vrf.imports.is_connected(rt_node):
        vrf.imports.connect(rt_node)
        
    return {"message": f"Import RT {rt_in.rt} added"}

@router.post("/vrfs/{namespace}/{name}/targets/export")
def add_export_rt(namespace: str, name: str, rt_in: RouteTargetSchema):
    vrf = VRF.nodes.first_or_none(namespace=namespace, name=name)
    if not vrf:
        raise HTTPException(status_code=404, detail="VRF not found")
    
    rt_node = RouteTarget.nodes.first_or_none(rt=rt_in.rt)
    if not rt_node:
        rt_node = RouteTarget(rt=rt_in.rt).save()
        
    if not vrf.exports.is_connected(rt_node):
        vrf.exports.connect(rt_node)
        
    return {"message": f"Export RT {rt_in.rt} added"}

@router.delete("/vrfs/{namespace}/{name}/targets/import/{rt}")
def remove_import_rt(namespace: str, name: str, rt: str):
    vrf = VRF.nodes.first_or_none(namespace=namespace, name=name)
    if not vrf:
        raise HTTPException(status_code=404, detail="VRF not found")
    
    rt_node = RouteTarget.nodes.first_or_none(rt=rt)
    if rt_node and vrf.imports.is_connected(rt_node):
        vrf.imports.disconnect(rt_node)
        
    return {"message": f"Import RT {rt} removed"}

@router.delete("/vrfs/{namespace}/{name}/targets/export/{rt}")
def remove_export_rt(namespace: str, name: str, rt: str):
    vrf = VRF.nodes.first_or_none(namespace=namespace, name=name)
    if not vrf:
        raise HTTPException(status_code=404, detail="VRF not found")
        
    rt_node = RouteTarget.nodes.first_or_none(rt=rt)
    if rt_node and vrf.exports.is_connected(rt_node):
        vrf.exports.disconnect(rt_node)
        
    return {"message": f"Export RT {rt} removed"}

# Prefixes

@router.post("/vrfs/{namespace}/{name}/prefixes")
def add_prefix(namespace: str, name: str, prefix_in: PrefixSchema):
    vrf = VRF.nodes.first_or_none(namespace=namespace, name=name)
    if not vrf:
        raise HTTPException(status_code=404, detail="VRF not found")
    
    # Check if prefix already exists in this VRF
    # We can iterate or check via cypher.
    # Since prefixes relationship is from VRF -> Prefix (outgoing HAS_PREFIX from VRF logic in model?)
    # Wait, in model: `prefixes = RelationshipFrom('Prefix', 'BELONGS_TO')`
    # So the relationship is Prefix -> BELONGS_TO -> VRF.
    # VRF.prefixes gives us the prefixes that belong to this VRF.
    
    # Check if this CIDR exists for this VRF
    # (Simple linear scan if not many, or better cypher query)
    # Using python list comp for now:
    for p in vrf.prefixes:
        if p.cidr == prefix_in.cidr:
            raise HTTPException(status_code=400, detail="Prefix already exists in this VRF")
            
    # Create prefix
    p = Prefix(cidr=prefix_in.cidr).save()
    # Connect Prefix -> VRF (BELONGS_TO)
    # Since we have defined `vrf = RelationshipTo('VRF', 'BELONGS_TO')` in Prefix model:
    p.vrf.connect(vrf)
    
    return {"message": f"Prefix {prefix_in.cidr} added"}

@router.delete("/vrfs/{namespace}/{name}/prefixes")
def remove_prefix(namespace: str, name: str, prefix_in: PrefixSchema):
    vrf = VRF.nodes.first_or_none(namespace=namespace, name=name)
    if not vrf:
        raise HTTPException(status_code=404, detail="VRF not found")
        
    # Find the prefix node for this VRF
    target_p = None
    for p in vrf.prefixes:
        if p.cidr == prefix_in.cidr:
            target_p = p
            break
            
    if target_p:
        target_p.delete() # Delete the node itself as it belongs to this VRF
        
    return {"message": f"Prefix {prefix_in.cidr} removed"}

#!/usr/bin/env python3
"""
Script to generate sample data for the MPBGP EVPN Route Manager API.

Usage:
    python scripts/generate_data.py [--api-url URL] [--num-vrfs N] [--namespace NS]
"""

import argparse
import random
import requests
import sys


class DataGenerator:
    def __init__(self, api_url: str = "http://localhost:8000"):
        self.api_url = api_url.rstrip('/')
        self.base_url = f"{self.api_url}/api/v1"
        
    def check_api_health(self) -> bool:
        """Check if the API is accessible."""
        try:
            response = requests.get(f"{self.api_url}/", timeout=5)
            return response.status_code == 200
        except requests.exceptions.RequestException as e:
            print(f"Error connecting to API at {self.api_url}: {e}")
            return False
    
    def generate_rd(self, asn: int = None, value: int = None) -> str:
        """Generate a Route Distinguisher in format ASN:NN or IP:NN."""
        if asn is None:
            asn = random.randint(65000, 65535)
        if value is None:
            value = random.randint(1, 65535)
        return f"{asn}:{value}"
    
    def generate_rt(self, asn: int = None, value: int = None) -> str:
        """Generate a Route Target in format ASN:NN or IP:NN."""
        return self.generate_rd(asn, value)
    
    def generate_cidr(self, base_ip: str = None) -> str:
        """Generate a random CIDR prefix."""
        if base_ip is None:
            # Generate random private IP ranges
            first_octet = random.choice([10, 172, 192])
            if first_octet == 10:
                ip = f"10.{random.randint(0, 255)}.{random.randint(0, 255)}.0"
                prefix_len = random.choice([16, 20, 24])
            elif first_octet == 172:
                ip = f"172.{random.randint(16, 31)}.{random.randint(0, 255)}.0"
                prefix_len = random.choice([16, 20, 24])
            else:
                ip = f"192.168.{random.randint(0, 255)}.0"
                prefix_len = random.choice([24])
        else:
            ip = base_ip
            prefix_len = random.choice([16, 20, 24])
        
        return f"{ip}/{prefix_len}"
    
    def create_vrf(self, name: str, namespace: str = "default", rd: str = None) -> dict:
        """Create a VRF via API."""
        if rd is None:
            rd = self.generate_rd()
        
        url = f"{self.base_url}/vrfs/"
        data = {
            "name": name,
            "namespace": namespace,
            "rd": rd
        }
        
        try:
            response = requests.post(url, json=data)
            if response.status_code == 200:
                return response.json()
            elif response.status_code == 400:
                print(f"  Warning: VRF '{name}' in namespace '{namespace}' already exists or RD '{rd}' is in use")
                return None
            else:
                print(f"  Error creating VRF '{name}': {response.status_code} - {response.text}")
                return None
        except requests.exceptions.RequestException as e:
            print(f"  Error creating VRF '{name}': {e}")
            return None
    
    def add_route_target(self, namespace: str, vrf_name: str, rt: str, rt_type: str = "import") -> bool:
        """Add an import or export route target to a VRF."""
        url = f"{self.base_url}/vrfs/{namespace}/{vrf_name}/targets/{rt_type}"
        data = {"rt": rt}
        
        try:
            response = requests.post(url, json=data)
            if response.status_code == 200:
                return True
            elif response.status_code == 404:
                print(f"  Warning: VRF '{vrf_name}' in namespace '{namespace}' not found")
                return False
            else:
                print(f"  Error adding {rt_type} RT '{rt}': {response.status_code} - {response.text}")
                return False
        except requests.exceptions.RequestException as e:
            print(f"  Error adding {rt_type} RT '{rt}': {e}")
            return False
    
    def add_prefix(self, namespace: str, vrf_name: str, cidr: str) -> bool:
        """Add a prefix to a VRF."""
        url = f"{self.base_url}/vrfs/{namespace}/{vrf_name}/prefixes"
        data = {"cidr": cidr}
        
        try:
            response = requests.post(url, json=data)
            if response.status_code == 200:
                return True
            elif response.status_code == 404:
                print(f"  Warning: VRF '{vrf_name}' in namespace '{namespace}' not found")
                return False
            elif response.status_code == 400:
                print(f"  Warning: Prefix '{cidr}' already exists in VRF '{vrf_name}'")
                return False
            else:
                print(f"  Error adding prefix '{cidr}': {response.status_code} - {response.text}")
                return False
        except requests.exceptions.RequestException as e:
            print(f"  Error adding prefix '{cidr}': {e}")
            return False
    
    def generate_vrf_data(self, namespace: str, vrf_name: str, num_imports: int = 2, 
                         num_exports: int = 2, num_prefixes: int = 3) -> dict:
        """Generate complete VRF data with route targets and prefixes."""
        # Generate unique RD
        rd = self.generate_rd()
        
        # Create VRF
        print(f"Creating VRF: {namespace}/{vrf_name} (RD: {rd})")
        vrf = self.create_vrf(vrf_name, namespace, rd)
        
        if not vrf:
            return None
        
        # Generate and add import route targets
        import_rts = []
        for i in range(num_imports):
            rt = self.generate_rt()
            if self.add_route_target(namespace, vrf_name, rt, "import"):
                import_rts.append(rt)
                print(f"  Added import RT: {rt}")
        
        # Generate and add export route targets
        export_rts = []
        for i in range(num_exports):
            rt = self.generate_rt()
            if self.add_route_target(namespace, vrf_name, rt, "export"):
                export_rts.append(rt)
                print(f"  Added export RT: {rt}")
        
        # Generate and add prefixes
        prefixes = []
        for i in range(num_prefixes):
            cidr = self.generate_cidr()
            if self.add_prefix(namespace, vrf_name, cidr):
                prefixes.append(cidr)
                print(f"  Added prefix: {cidr}")
        
        return {
            "vrf": vrf,
            "import_rts": import_rts,
            "export_rts": export_rts,
            "prefixes": prefixes
        }
    
    def generate_sample_data(self, num_vrfs: int = 5, namespace: str = "default",
                           imports_per_vrf: int = 2, exports_per_vrf: int = 2,
                           prefixes_per_vrf: int = 3):
        """Generate sample data for the API."""
        print(f"Generating {num_vrfs} VRFs in namespace '{namespace}'...")
        print(f"  - {imports_per_vrf} import RTs per VRF")
        print(f"  - {exports_per_vrf} export RTs per VRF")
        print(f"  - {prefixes_per_vrf} prefixes per VRF")
        print()
        
        if not self.check_api_health():
            print("API is not accessible. Please ensure the API server is running.")
            sys.exit(1)
        
        created_vrfs = []
        
        for i in range(1, num_vrfs + 1):
            vrf_name = f"vrf-{i:03d}"
            vrf_data = self.generate_vrf_data(
                namespace=namespace,
                vrf_name=vrf_name,
                num_imports=imports_per_vrf,
                num_exports=exports_per_vrf,
                num_prefixes=prefixes_per_vrf
            )
            
            if vrf_data:
                created_vrfs.append(vrf_data)
            print()
        
        print(f"Successfully created {len(created_vrfs)} VRFs")
        return created_vrfs


def main():
    parser = argparse.ArgumentParser(
        description="Generate sample data for MPBGP EVPN Route Manager API"
    )
    parser.add_argument(
        "--api-url",
        default="http://localhost:8000",
        help="Base URL of the API (default: http://localhost:8000)"
    )
    parser.add_argument(
        "--num-vrfs",
        type=int,
        default=5,
        help="Number of VRFs to create (default: 5)"
    )
    parser.add_argument(
        "--namespace",
        default="default",
        help="Namespace for VRFs (default: default)"
    )
    parser.add_argument(
        "--imports",
        type=int,
        default=2,
        help="Number of import route targets per VRF (default: 2)"
    )
    parser.add_argument(
        "--exports",
        type=int,
        default=2,
        help="Number of export route targets per VRF (default: 2)"
    )
    parser.add_argument(
        "--prefixes",
        type=int,
        default=3,
        help="Number of prefixes per VRF (default: 3)"
    )
    
    args = parser.parse_args()
    
    generator = DataGenerator(api_url=args.api_url)
    generator.generate_sample_data(
        num_vrfs=args.num_vrfs,
        namespace=args.namespace,
        imports_per_vrf=args.imports,
        exports_per_vrf=args.exports,
        prefixes_per_vrf=args.prefixes
    )


if __name__ == "__main__":
    main()

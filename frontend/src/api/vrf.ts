import client from './client';

export interface VRF {
  name: string;
  namespace: string;
  rd: string;
  imports: string[];
  exports: string[];
  prefixes: string[];
}

export interface CreateVRFParams {
  name: string;
  namespace: string;
  rd: string;
}

export const getVRFs = async (namespace?: string) => {
  const params = namespace ? { namespace } : {};
  const response = await client.get<VRF[]>('/vrfs/', { params });
  return response.data;
};

export const createVRF = async (data: CreateVRFParams) => {
  const response = await client.post<VRF>('/vrfs/', data);
  return response.data;
};

export const getVRF = async (namespace: string, name: string) => {
  const response = await client.get<VRF>(`/vrfs/${namespace}/${name}`);
  return response.data;
};

export const deleteVRF = async (namespace: string, name: string) => {
    await client.delete(`/vrfs/${namespace}/${name}`);
}

export const addImport = async (namespace: string, name: string, rt: string) => {
    await client.post(`/vrfs/${namespace}/${name}/targets/import`, { rt });
}

export const removeImport = async (namespace: string, name: string, rt: string) => {
    await client.delete(`/vrfs/${namespace}/${name}/targets/import/${rt}`);
}

export const addExport = async (namespace: string, name: string, rt: string) => {
    await client.post(`/vrfs/${namespace}/${name}/targets/export`, { rt });
}

export const removeExport = async (namespace: string, name: string, rt: string) => {
    await client.delete(`/vrfs/${namespace}/${name}/targets/export/${rt}`);
}

export const addPrefix = async (namespace: string, name: string, cidr: string) => {
    await client.post(`/vrfs/${namespace}/${name}/prefixes`, { cidr });
}

export const removePrefix = async (namespace: string, name: string, cidr: string) => {
    await client.delete(`/vrfs/${namespace}/${name}/prefixes`, { data: { cidr } });
}

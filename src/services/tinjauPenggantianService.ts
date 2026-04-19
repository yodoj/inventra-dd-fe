import api from "@/services/api";
import type { AxiosResponse, AxiosError } from "axios";
import type {
  TinjauPenggantianRequestDTO,
  TinjauPenggantianResponseDTO,
  BaseResponseDTO,
} from "@/interfaces/tinjauPenggantian";

const API_BASE = "/api/penggantian/tinjau";

function unwrap<T>(res: AxiosResponse<BaseResponseDTO<T>>): T {
  const body = res.data;

  if (body?.success === false) {
    throw new Error(body?.message || "Request gagal");
  }

  if (body?.data === undefined) {
    throw new Error(body?.message || "Response tidak berisi data");
  }

  return body.data;
}

function getErrorMessage(err: unknown): string {
  const e = err as AxiosError<BaseResponseDTO<any>>;

  const fromBE = e?.response?.data?.message;
  if (fromBE) return fromBE;

  const fromBE2 = (e?.response?.data as any)?.error?.message;
  if (fromBE2) return fromBE2;

  return (e as any)?.message || "Terjadi kesalahan";
}

export const tinjauPenggantianService = {
  async getAll(params?: { status_penggantian?: string; search?: string }): Promise<TinjauPenggantianResponseDTO[]> {
    try {
      const res = await api.get<BaseResponseDTO<TinjauPenggantianResponseDTO[]>>(
        "/api/penggantian/tinjau/all",
        {
        params: {
          status_penggantian: params?.status_penggantian || undefined,
          search: params?.search || undefined,
        }
      }
      );
      return unwrap(res);
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  async getByPenggantianId(penggantianId: string): Promise<TinjauPenggantianResponseDTO> {
    try {
      const res = await api.get<BaseResponseDTO<TinjauPenggantianResponseDTO>>(
        `/api/penggantian/tinjau/${penggantianId}`
      );
      return unwrap(res);
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  async create(penggantianId: string, payload: TinjauPenggantianRequestDTO): Promise<TinjauPenggantianResponseDTO> {
    try {
      const res = await api.post<BaseResponseDTO<TinjauPenggantianResponseDTO>>(
        `/api/penggantian/tinjau/${penggantianId}`,
        payload
      );
      return unwrap(res);
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  async update(penggantianId: string, payload: TinjauPenggantianRequestDTO): Promise<TinjauPenggantianResponseDTO> {
    try {
      const res = await api.put<BaseResponseDTO<TinjauPenggantianResponseDTO>>(
        `/api/penggantian/tinjau/${penggantianId}`,
        payload
      );
      return unwrap(res);
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },




};

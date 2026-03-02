import api from "@/services/api";
import type { AxiosResponse, AxiosError } from "axios";
import type {
  TinjauPengadaanRequestDTO,
  TinjauPengadaanResponseDTO,
  BaseResponseDTO
} from "@/interfaces/tinjauPengadaan";

const API_BASE = "/api/pengadaan";

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

export const tinjauPengadaanService = {
  async getAll(): Promise<TinjauPengadaanResponseDTO[]> {
    try {
      const res = await api.get<BaseResponseDTO<TinjauPengadaanResponseDTO[]>>(
        "/api/pengadaan/tinjau/all"
      );
      return unwrap(res);
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  async getByPengadaanId(pengadaanId: number): Promise<TinjauPengadaanResponseDTO> {
    try {
      const res = await api.get<BaseResponseDTO<TinjauPengadaanResponseDTO>>(
        `/api/pengadaan/tinjau/${pengadaanId}`
      );
      return unwrap(res);
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  async create(pengadaanId: number, payload: TinjauPengadaanRequestDTO): Promise<TinjauPengadaanResponseDTO> {
    try {
      const res = await api.post<BaseResponseDTO<TinjauPengadaanResponseDTO>>(
        `/api/pengadaan/tinjau/${pengadaanId}`,
        payload
      );
      return unwrap(res);
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  async update(pengadaanId: number, payload: TinjauPengadaanRequestDTO): Promise<TinjauPengadaanResponseDTO> {
    try {
      const res = await api.put<BaseResponseDTO<TinjauPengadaanResponseDTO>>(
        `/api/pengadaan/tinjau/update/${pengadaanId}`,
        payload
      );
      return unwrap(res);
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },
};

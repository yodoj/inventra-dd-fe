import api from "@/services/api";
import type { AxiosResponse, AxiosError } from "axios";
import type {
  PenggantianBarangRusakRequestDTO,
  PenggantianBarangRusakResponseDTO,
  BaseResponseDTO
} from "@/interfaces/PenggantianBarangRusak";

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

export const penggantianBarangRusakService = {

  async getAll(params?: { status?: string; search?: string })
  : Promise<PenggantianBarangRusakResponseDTO[]> {
    try {
      const res = await api.get<BaseResponseDTO<PenggantianBarangRusakResponseDTO[]>>(
        "/api/penggantian/all",
        {
          params: {
            status: params?.status || undefined,
            search: params?.search || undefined
          }
        }
      );

      return unwrap(res);
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  async create(
    payload: FormData
  ): Promise<PenggantianBarangRusakResponseDTO> {

    try {

      const res = await api.post<BaseResponseDTO<PenggantianBarangRusakResponseDTO>>(
        "/api/penggantian",
        payload,
        {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        }
      )

      return unwrap(res)

    } catch (err) {
      throw new Error(getErrorMessage(err))
    }
  },
  async getById(
    idPenggantian: string
  ): Promise<PenggantianBarangRusakResponseDTO> {

    try {

      const res =
        await api.get<BaseResponseDTO<PenggantianBarangRusakResponseDTO>>(
          `/api/penggantian/${idPenggantian}`
        )

      return unwrap(res)

    } catch (err) {
      throw new Error(getErrorMessage(err))
    }
  },

  async update(
    idPenggantian: string,
    payload: FormData
  ): Promise<PenggantianBarangRusakResponseDTO> {

    try {

      const res =
        await api.put<BaseResponseDTO<PenggantianBarangRusakResponseDTO>>(
          `/api/penggantian/${idPenggantian}`,
          payload,
          {
            headers: {
              "Content-Type": "multipart/form-data"
            }
          }
        )

      return unwrap(res)

    } catch (err) {
      throw new Error(getErrorMessage(err))
    }
  },

  async delete(
    idPenggantian: string
  ): Promise<void> {

    try {

      const res =
        await api.delete<BaseResponseDTO<null>>(
          `/api/penggantian/${idPenggantian}`
        )

      unwrap(res)

    } catch (err) {

      throw new Error(getErrorMessage(err))

    }
  }
};

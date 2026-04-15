import { isBrowser, isDocumentAvailable } from '../env'
import type { StorageKey, StorageSchema, WebSessionStorage } from '../storage'

/**
 * 表单自动保存 schema 辅助类型。
 * @public
 */
export type FormAutoSaveSchema<
  TFormData extends Record<string, FormDataEntryValue>,
> = Record<`form_${string}`, TFormData>

/**
 * 表单自动保存结果。
 * @public
 */
export type BindFormAutoSaveResult =
  | { ok: true; code: null; dispose: () => void }
  | {
      ok: false
      code: 'DOCUMENT_UNAVAILABLE' | 'FORM_NOT_FOUND'
      dispose: () => void
    }

/**
 * 绑定表单自动保存。
 * @param storage - Session storage 实例。
 * @param formId - 表单元素 id。
 * @param interval - 自动保存间隔，单位毫秒。
 * @returns 自动保存绑定结果。
 * @public
 */
export function bindFormAutoSave<
  TFormData extends Record<string, FormDataEntryValue>,
  Schema extends StorageSchema & FormAutoSaveSchema<TFormData>,
>(
  storage: WebSessionStorage<Schema>,
  formId: string,
  interval: number = 5000,
): BindFormAutoSaveResult {
  if (!isBrowser() || !isDocumentAvailable()) {
    return {
      ok: false,
      code: 'DOCUMENT_UNAVAILABLE',
      dispose: () => {},
    }
  }

  const form = document.getElementById(formId) as HTMLFormElement | null
  if (!form) {
    return {
      ok: false,
      code: 'FORM_NOT_FOUND',
      dispose: () => {},
    }
  }

  /**
   * 保存表单数据。
   * @returns 无返回值。
   */
  const saveFormData = () => {
    const formData = new FormData(form)
    storage.setStorageSync(
      `form_${formId}` as StorageKey<Schema>,
      Object.fromEntries(formData.entries()) as Schema[StorageKey<Schema>],
    )
  }

  const timer = setInterval(saveFormData, interval)
  const handleBeforeUnload = () => saveFormData()
  window.addEventListener('beforeunload', handleBeforeUnload)

  return {
    ok: true,
    code: null,
    dispose: () => {
      clearInterval(timer)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    },
  }
}

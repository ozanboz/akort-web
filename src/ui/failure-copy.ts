import type { AudioFailure } from '../audio/errors'

interface FailureCopy {
  title: string
  body: string
  canRetry: boolean
}

const COPY: Record<AudioFailure, FailureCopy> = {
  'permission-denied': {
    title: 'Mikrofon izni verilmedi',
    body: 'Tarayıcının adres çubuğundaki kilit simgesinden mikrofon iznini açıp yeniden deneyin.',
    canRetry: true,
  },
  'no-microphone': {
    title: 'Mikrofon bulunamadı',
    body: 'Bu cihazda kullanılabilir bir mikrofon yok.',
    canRetry: false,
  },
  'device-busy': {
    title: 'Mikrofon kullanımda',
    body: 'Başka bir uygulama mikrofonu kullanıyor olabilir. Kapatıp yeniden deneyin.',
    canRetry: true,
  },
  'insecure-context': {
    title: 'Güvenli bağlantı gerekiyor',
    body: 'Mikrofon yalnız HTTPS üzerinden çalışır.',
    canRetry: false,
  },
  unsupported: {
    title: 'Tarayıcı desteklemiyor',
    body: 'Bu tarayıcı mikrofon üzerinden akort için gereken ses özelliklerini desteklemiyor.',
    canRetry: false,
  },
  'device-lost': {
    title: 'Mikrofon bağlantısı kesildi',
    body: 'Cihaz çıkarıldı ya da bağlantısı koptu. Yeniden bağlayıp deneyin.',
    canRetry: true,
  },
}

export function failureCopy(failure: AudioFailure): FailureCopy {
  return COPY[failure]
}

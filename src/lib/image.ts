const MAX_IMAGE_SIZE_MB = 5

export function validateImageFile(file: File): string | null {
  const accepted = ['image/png', 'image/jpeg', 'image/webp']
  if (!accepted.includes(file.type)) {
    return 'Akceptowane formaty: PNG, JPG, WEBP'
  }
  if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
    return `Obraz jest za duży (max ${MAX_IMAGE_SIZE_MB}MB)`
  }
  return null
}

export async function resizeImage(file: File, maxDimension = 1024): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const { width, height } = bitmap

  let targetW = width
  let targetH = height
  if (Math.max(width, height) > maxDimension) {
    const scale = maxDimension / Math.max(width, height)
    targetW = Math.round(width * scale)
    targetH = Math.round(height * scale)
  }

  const canvas = document.createElement('canvas')
  canvas.width = targetW
  canvas.height = targetH
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas niedostępny')
  ctx.drawImage(bitmap, 0, 0, targetW, targetH)
  bitmap.close()

  const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
  return dataUrl.split(',')[1]
}

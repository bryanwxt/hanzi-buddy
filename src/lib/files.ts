/** Share sheet on iPad (save to Files/iCloud), download elsewhere. Rethrows AbortError if cancelled. */
export async function saveTextFile(filename: string, text: string): Promise<void> {
  const file = new File([text], filename, { type: 'application/json' });
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: filename });
    return;
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

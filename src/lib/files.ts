/**
 * Share sheet on iPad (save to Files/iCloud), download elsewhere. Rethrows AbortError if cancelled.
 * Safari refuses share() once a slow export has used up the tap's user activation
 * (NotAllowedError); then we fall back to a download, which Safari still allows.
 */
export async function saveTextFile(filename: string, text: string): Promise<void> {
  const file = new File([text], filename, { type: 'application/json' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: filename });
      return;
    } catch (e) {
      if (!(e instanceof DOMException && e.name === 'NotAllowedError')) throw e;
    }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

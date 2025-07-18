import { BlobServiceClient } from "@azure/storage-blob";
import { generateThumbnail } from "./thumbnailGenerator";

// Define a placeholder SVG constant to use when no image is available.
const placeholderSvg = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNlZWVlZWUiIC8+PHRleHQgeD0iNTAiIHk9IjU1IiBmb250LXNpemU9IjE2IiBmb250LWZhbWlseT0iU2VnZSBTaWduIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5OTk5Ij5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=";

export class ImageUploader {
  private container: HTMLElement;
  private propertyId: string;
  private sasToken: string;
  private webAPI: ComponentFramework.WebApi;
  private imageSlots: HTMLDivElement[] = [];
  // Array to store Dataverse record IDs for each image slot.
  private recordIds: (string | null)[] = [];

  constructor(
    container: HTMLElement,
    propertyId: string,
    sasToken: string,
    webAPI: ComponentFramework.WebApi
  ) {
    this.container = container;
    this.propertyId = propertyId;
    this.sasToken = sasToken;
    this.webAPI = webAPI;

    this.renderLayout();

    console.log("*** Bound ImageUploader -- PropertyID value: ", propertyId);

    this.loadExistingImages().catch((error) => {
      this.showNotification("*** Error loading images: " + error, "error");
      console.error("*** Error loading images:", error);
    });
  }

  public setPropertyId(propertyId: string): void {
    this.propertyId = propertyId;
    this.loadExistingImages().catch((error) => {
      this.showNotification("*** Error re-loading images: " + error, "error");
      console.error("*** Error re-loading images:", error);
    });
  }

  private renderLayout(): void {
    const wrapper = document.createElement("div");
    wrapper.className = "iqari-image-uploader-wrapper modern-d365";

    // Header
    const header = document.createElement("h3");
    header.innerText = "Property Images";
    wrapper.appendChild(header);

    // Command bar for actions
    const commandBar = document.createElement("div");
    commandBar.className = "d365-command-bar";
    wrapper.appendChild(commandBar);

    // "Upload Images" button
    const addButton = document.createElement("button");
    addButton.innerText = "Upload Images";
    addButton.onclick = () => this.onUploadImages();
    commandBar.appendChild(addButton);

    // Grid for image slots
    const grid = document.createElement("div");
    grid.className = "iqari-image-grid modern-d365-grid";

    for (let i = 0; i < 8; i++) {
      const slot = this.createImageSlot(i);
      this.imageSlots.push(slot);
      this.recordIds.push(null);
      grid.appendChild(slot);
    }
    wrapper.appendChild(grid);
    this.container.appendChild(wrapper);
    this.createNotificationArea();
  }

  private createNotificationArea(): void {
    const notification = document.createElement("div");
    notification.className = "notification-area modern-d365-notification";
    notification.style.display = "none";
    this.container.appendChild(notification);
  }

  private showNotification(
    message: string,
    type: "info" | "success" | "error",
    progress?: number
  ): void {
    const notification = this.container.querySelector(".notification-area") as HTMLDivElement;
    if (!notification) return;
    notification.innerHTML = "";
    notification.style.display = "block";
    notification.className = "notification-area modern-d365-notification " + type;
    const span = document.createElement("span");
    span.innerText = message;
    notification.appendChild(span);
    if (progress !== undefined) {
      const progressBar = document.createElement("div");
      progressBar.className = "progress-bar";
      const progressFill = document.createElement("div");
      progressFill.className = "progress-fill";
      progressFill.style.width = progress + "%";
      progressBar.appendChild(progressFill);
      notification.appendChild(progressBar);
    }
  }

  private hideNotification(): void {
    const notification = this.container.querySelector(".notification-area") as HTMLDivElement;
    if (notification) {
      notification.style.display = "none";
    }
  }

  private createImageSlot(index: number): HTMLDivElement {
    const slot = document.createElement("div");
    slot.className = "iqari-image-slot modern-d365-slot";

    const img = document.createElement("img");
    img.setAttribute("src", placeholderSvg);
    img.alt = "No image";
    img.className = "iqari-image-preview modern-d365-image";
    img.onerror = () => {
      img.src = placeholderSvg;
    };
    slot.appendChild(img);

    const replaceButton = document.createElement("button");
    replaceButton.innerText = "Replace";
    replaceButton.className = "d365-secondary-button";
    replaceButton.onclick = () => this.onReplaceImage(index);
    slot.appendChild(replaceButton);

    const deleteButton = document.createElement("button");
    deleteButton.innerText = "Delete";
    deleteButton.className = "d365-secondary-button";
    deleteButton.onclick = () => this.onDeleteImage(index);
    slot.appendChild(deleteButton);

    return slot;
  }

  private async onUploadImages(): Promise<void> {
    if (!this.propertyId) {
      this.showNotification("*** Property ID is undefined—cannot upload images.", "error");
      return;
    }
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.multiple = true;
    fileInput.style.display = "none";

    fileInput.onchange = async () => {
      if (fileInput.files) {
        console.log("***  uploading file: 1");
        for (let i = 0; i < fileInput.files.length && i < 8; i++) {
          const file = fileInput.files[i];
          try {
            console.log("***  uploading file: 2");
            this.showNotification(`*** Uploading ${file.name}...`, "info", 0);
            const imageUrl = await this.uploadFileToBlob(file, (progress) => {
              this.showNotification(`*** Uploading ${file.name}...`, "info", progress);
            });
            const thumbnailData = await generateThumbnail(file);
            const isPrimary = !this.recordIds.some(id => id !== null);
            const base64Data = thumbnailData.split(",")[1];
          //  console.log("*** onUploadImages this.propertyId: ", this.propertyId);
            console.log("***  uploading file: 3");
            const record = {
              "iqa_property@odata.bind": `/iqa_properties(${this.propertyId})`,
              "iqa_imageurl": imageUrl,
              "iqa_imagethumbnail": base64Data,
             // "iqa_primarylistingimage": isPrimary ? 1 : 0
            };

            console.log("*** onUploadImages Bound record value: ", record);


            const response = await this.webAPI.createRecord("iqa_propertyimage", record) as unknown as { entityId: string };
            let slotIndex = this.imageSlots.findIndex((slot) => {
              const img = slot.querySelector("img") as HTMLImageElement;
              return (!img.getAttribute("src") || img.getAttribute("src")?.trim() === "" || img.src === placeholderSvg);
            });
            if (slotIndex === -1) slotIndex = 0;
            this.recordIds[slotIndex] = response.entityId;
            const slot = this.imageSlots[slotIndex];
            const img = slot.querySelector("img") as HTMLImageElement;
            img.src = imageUrl;
            this.showNotification(`*** Uploaded ${file.name} successfully.`, "success");
            setTimeout(() => this.hideNotification(), 3000);
          } catch (error) {
            console.error("*** Error uploading file:", file.name, error);
            this.showNotification(`*** Error uploading ${file.name}.`, "error");
          }
        }
      }
    };

    fileInput.click();
  }

  private async onReplaceImage(slotIndex: number): Promise<void> {
    if (!this.propertyId) {
      this.showNotification("*** Property ID is undefined—cannot replace images.", "error");
      return;
    }
    const slot = this.imageSlots[slotIndex];
    const img = slot.querySelector("img") as HTMLImageElement;
    const existingUrl = img.src;
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.style.display = "none";

    fileInput.onchange = async () => {
      if (fileInput.files && fileInput.files.length > 0) {
        const file = fileInput.files[0];
        try {
          this.showNotification(`*** Replacing ${file.name}...`, "info", 0);
          let blobName: string | null = null;
          if (existingUrl && existingUrl !== placeholderSvg) {
            try {
              const urlObj = new URL(existingUrl);
              const parts = urlObj.pathname.split("/");
              if (parts.length >= 3) {
                blobName = parts.slice(2).join("/");
              }
            } catch (err) {
              console.warn("*** Could not parse existing URL:", existingUrl);
            }
          }
          const accountName = "1stiqaridev";
          const containerName = "1stiqariimages";
          const blobServiceClient = new BlobServiceClient(
            `https://${accountName}.blob.core.windows.net?${this.sasToken}`
          );
          const containerClient = blobServiceClient.getContainerClient(containerName);

          if (blobName) {
            try {
              await containerClient.deleteBlob(blobName);
              console.debug("*** Deleted existing blob:", blobName);
            } catch (deleteError) {
              console.warn("*** Could not delete existing blob. Proceeding with upload.", deleteError);
            }
          }
          if (!blobName) {
            blobName = `${this.propertyId}/${new Date().getTime()}_${file.name}`;
          }
          const blockBlobClient = containerClient.getBlockBlobClient(blobName);
          const options = {
            blobHTTPHeaders: { blobContentType: file.type },
            onProgress: (progressEvent: { loadedBytes: number }) => {
              const progress = Math.round((progressEvent.loadedBytes / file.size) * 100);
              this.showNotification(`*** Replacing ${file.name}...`, "info", progress);
            }
          };
          await blockBlobClient.uploadBrowserData(file, options);
          const newUrl = blockBlobClient.url;
          const thumbnailData = await generateThumbnail(file);
          const isPrimary = false;
          const record = {
            "iqa_property@odata.bind": `/iqa_properties(${this.propertyId})`,
            "iqa_imageurl": newUrl,
            "iqa_imagethumbnail": thumbnailData,
            "iqa_primarylistingimage": isPrimary ? 1 : 0
          };
          await this.webAPI.createRecord("iqa_propertyimage", record);
          this.recordIds[slotIndex] = null;
          img.src = newUrl;
          this.showNotification(`*** Replaced ${file.name} successfully.`, "success");
          setTimeout(() => this.hideNotification(), 3000);
        } catch (error) {
          console.error("*** Error replacing file:", error);
          this.showNotification(`*** Error replacing ${file.name}.`, "error");
        }
      }
    };

    fileInput.click();
  }

  private async onDeleteImage(slotIndex: number): Promise<void> {
    if (!this.propertyId) {
      this.showNotification("*** Property ID is undefined—cannot delete images.", "error");
      return;
    }
    const slot = this.imageSlots[slotIndex];
    const img = slot.querySelector("img") as HTMLImageElement;
    const existingUrl = img.src;
    if (!existingUrl || existingUrl === placeholderSvg) {
      this.showNotification("*** No image found in this slot to delete.", "error");
      return;
    }
    if (!confirm("Are you sure you want to delete this image?")) {
      return;
    }
    this.showNotification("*** Deleting image...", "info", 0);
    try {
      await this.deleteBlob(existingUrl);
      if (this.recordIds[slotIndex]) {
        await this.webAPI.deleteRecord("iqa_propertyimage", this.recordIds[slotIndex]!);
        this.recordIds[slotIndex] = null;
      }
      this.showNotification("*** Image deleted successfully.", "success");
      img.src = placeholderSvg;
      setTimeout(() => this.hideNotification(), 3000);
    } catch (error) {
      console.error("*** Error deleting image:", error);
      this.showNotification("*** Failed to delete image.", "error");
    }
  }

  private async deleteBlob(blobUrl: string): Promise<void> {
    const accountName = "1stiqaridev";
    const containerName = "1stiqariimages";
    const blobServiceClient = new BlobServiceClient(
      `https://${accountName}.blob.core.windows.net?${this.sasToken}`
    );
    const containerClient = blobServiceClient.getContainerClient(containerName);
    let blobName: string | null = null;
    try {
      const urlObj = new URL(blobUrl);
      const parts = urlObj.pathname.split("/");
      if (parts.length >= 3) {
        blobName = parts.slice(2).join("/");
      }
    } catch (err) {
      console.warn("*** Could not parse blob URL:", blobUrl);
      throw new Error("*** Invalid blob URL");
    }
    if (!blobName) {
      throw new Error("*** Blob name not found");
    }
    await containerClient.deleteBlob(blobName);
  }

  private async uploadFileToBlob(
    file: File,
    onProgressCallback?: (progress: number) => void
  ): Promise<string> {
    const accountName = "1stiqaridev";
    const containerName = "1stiqariimages";
    const blobServiceClient = new BlobServiceClient(
      `https://${accountName}.blob.core.windows.net?${this.sasToken}`
    );
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blobName = `${this.propertyId}/${new Date().getTime()}_${file.name}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    const options = { 
      blobHTTPHeaders: { blobContentType: file.type },
      onProgress: onProgressCallback ? (progressEvent: { loadedBytes: number }) => {
        const progress = Math.round((progressEvent.loadedBytes / file.size) * 100);
        onProgressCallback(progress);
      } : undefined
    };
    await blockBlobClient.uploadBrowserData(file, options);
    return blockBlobClient.url;
  }

  private async loadExistingImages(): Promise<void> {
    if (!this.propertyId) return;
    try {
      const accountName = "1stiqaridev";
      const containerName = "1stiqariimages";
      const blobServiceClient = new BlobServiceClient(
        `https://${accountName}.blob.core.windows.net?${this.sasToken}`
      );
      const containerClient = blobServiceClient.getContainerClient(containerName);
      const prefix = `${this.propertyId}/`;
      const blobUrls: string[] = [];
      for await (const blob of containerClient.listBlobsFlat({ prefix })) {
        const blockBlobClient = containerClient.getBlockBlobClient(blob.name);
        blobUrls.push(blockBlobClient.url);
        if (blobUrls.length >= 8) break;
      }
      for (let i = 0; i < this.imageSlots.length; i++) {
        const img = this.imageSlots[i].querySelector("img") as HTMLImageElement;
        if (i < blobUrls.length) {
          img.src = blobUrls[i];
        } else {
          img.src = placeholderSvg;
        }
      }
    } catch (error) {
      console.error("*** Error loading existing images:", error);
      this.showNotification("*** Error loading images.", "error");
    }
  }
}

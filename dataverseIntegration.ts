export async function createPropertyImageRecord(
    propertyId: string,
    imageUrl: string,
    thumbnailData: string,
    isPrimary: boolean,
    webApi: ComponentFramework.WebApi
  ): Promise<string> {
    const record = {
      "iqa_property@odata.bind": `/iqa_properties(${propertyId})`,
      "iqa_imageurl": imageUrl,
      "iqa_imagethumbnail": thumbnailData,
      "iqa_primarylistingimage": isPrimary ? 1 : 0,
    };
    // Cast the response to unknown then to the expected type.
    const response = await webApi.createRecord("iqa_propertyimage", record) as unknown as { entityId: string };
    return response.entityId;
  }
  
  export async function updatePropertyImageRecord(
    recordId: string,
    imageUrl: string,
    thumbnailData: string,
    isPrimary: boolean,
    webApi: ComponentFramework.WebApi
  ): Promise<void> {
    const record = {
      "iqa_imageurl": imageUrl,
      "iqa_imagethumbnail": thumbnailData,
      "iqa_primarylistingimage": isPrimary ? 1 : 0,
    };
    await webApi.updateRecord("iqa_propertyimage", recordId, record);
  }
  
  export async function deletePropertyImageRecord(
    recordId: string,
    webApi: ComponentFramework.WebApi
  ): Promise<void> {
    await webApi.deleteRecord("iqa_propertyimage", recordId);
  }
  
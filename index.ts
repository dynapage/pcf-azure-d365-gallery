import { IInputs, IOutputs } from "./generated/ManifestTypes";
import { ImageUploader } from "./ImageUploader";

export class IqariPictures implements ComponentFramework.StandardControl<IInputs, IOutputs> {
  private container: HTMLDivElement;
  private notifyOutputChanged: () => void;
  private uploader: ImageUploader;

  public init(
    context: ComponentFramework.Context<IInputs>,
    notifyOutputChanged: () => void,
    state: ComponentFramework.Dictionary,
    container: HTMLDivElement
  ): void {
    this.container = container;
    this.notifyOutputChanged = notifyOutputChanged;

    // Retrieve parent's GUID from the page context.
    // NOTE: The standard Context type does not include 'page', so we cast to any.
     // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pageContext = context as any;
    const propertyId = pageContext.page?.entityId || "";
    console.log("*** Retrieved parent entityId from page context: ", propertyId);

    const sasToken = (context.parameters.SasToken && context.parameters.SasToken.raw) || "";
    console.log("*** Retrieved SasToken: ", sasToken);

    // Log bound property value if available (for additional debugging)
    const boundVal = context.parameters.PropertyID && context.parameters.PropertyID.raw;
    console.log("*** Bound PropertyID value: ", boundVal);

    // Create the ImageUploader with container, parent's GUID, SAS token, and context.webAPI.
    this.uploader = new ImageUploader(container, propertyId, sasToken, context.webAPI);
  }

  public updateView(context: ComponentFramework.Context<IInputs>): void {
    // Optionally refresh if property values change.
    console.log("*** updateView called.");
  }

  public getOutputs(): IOutputs {
    return {};
  }

  public destroy(): void {
    console.log("*** destroy called.");
    // No cleanup required.
  }
}

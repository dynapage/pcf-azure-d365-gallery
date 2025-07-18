
# DynacloadAzureGallery
Dynacload Azure Gallery is a custom PowerApps Component Framework (PCF) 

**PCF Control** for managing property images with Azure Blob Storage and Dataverse.

## Description

DynacloadAzureGallery is a PowerApps Component Framework (PCF) standard control that enables users to upload, preview, replace, and delete up to eight images per entity record. It stores images in Azure Blob Storage using a SAS token and synchronizes metadata with Dataverse, including base64 thumbnails for efficient display.

## Features

- **Azure Blob Uploads**: Securely upload images using SAS tokens.
- **Dataverse Integration**: CRUD operations on `PropertyImage` records.
- **Thumbnail Previews**: Automatic thumbnail generation for fast loading.
- **Responsive UI**: Modern grid with placeholders, progress bars, and notifications.
- **Easy Configuration**: Simply bind your `PropertyID` and `SasToken` parameters.

## Prerequisites

- PowerApps (model‑driven or canvas) with PCF support.
- Azure Storage account and container.
- SAS token granting read/write/delete to the container.
- Dataverse solution with:
  - An entity (e.g. `Property`) with GUID available on the form.
  - A child entity `PropertyImage` with fields:
    - `imageurl` (URL)
    - `imagethumbnail` (Multiple Lines of Text)
    - `primarylistingimage` (Two Options)

## Installation

1. Update the `ControlManifest.Input.xml`:
   ```xml
   <control namespace="YourNamespace" constructor="DynacloadAzureGallery" version="1.0.0" display-name-key="DynacloadAzureGallery" description-key="Dynacload description">
     <property name="PropertyID" of-type="SingleLine.Text" usage="bound" required="true" />
     <property name="SasToken" of-type="Multiple" usage="input" required="true" />
     …
   </control>


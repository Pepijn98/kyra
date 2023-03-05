import { Document, Model, Schema, model } from "mongoose";

export interface Image {
    name: string;
    ext: string;
    hash: string;
    uploader: string;
    createdAt: string
}

export type ImageModel = Image & Document;

export const ImageSchema: Schema<ImageModel> = new Schema<ImageModel>({
    name: String,
    ext: String,
    hash: String,
    uploader: String,
    createdAt: String
});

export const Images: Model<ImageModel> = model<ImageModel>("Images", ImageSchema);

export default Images;

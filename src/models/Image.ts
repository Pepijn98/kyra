import { Document, Model, Schema, model } from "mongoose";

export type Image = {
    name: string;
    ext: string;
    hash: string;
    uploader: string;
    createdAt: string
};

export type ImageModel = Image & Document & { _id: string };

export const ImageSchema: Schema<ImageModel> = new Schema<ImageModel>({
    name: String,
    ext: String,
    hash: String,
    uploader: String,
    createdAt: String
});

ImageSchema.set("toJSON", {
    virtuals: true,
    transform: (_doc, converted) => {
        delete converted._id;
        delete converted.__v;
    }
});

export const Images: Model<ImageModel> = model<ImageModel>("Images", ImageSchema);

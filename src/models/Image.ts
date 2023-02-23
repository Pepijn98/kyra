import { Document, Model, Schema, model } from "mongoose";

interface ImageDoc extends Document {
    name: string;
    ext: string;
    hash: string;
    uploader: string;
    createdAt: string
}

const Image: Schema<ImageDoc> = new Schema<ImageDoc>({
    name: String,
    ext: String,
    hash: String,
    uploader: String,
    createdAt: String
});

const Images: Model<ImageDoc> = model<ImageDoc>("Images", Image);

export default Images;
export {
    ImageDoc,
    Image,
    Images
};

import { type Model, type Schema, model, models } from "mongoose";

export type Doc = {
  _id: unknown;
  [key: string]: any;
};

export function defineModel(name: string, schema: Schema): Model<Doc> {
  return (models[name] as Model<Doc>) || model<Doc>(name, schema);
}

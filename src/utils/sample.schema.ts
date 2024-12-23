export interface crudBy {
  _id: string
  email: string
}

export interface ISampleSchema {
  createdBy: crudBy
  updatedBy: crudBy
  deletedBy: crudBy
  createdAt: Date
  updatedAt: Date
  isDeleted: boolean
  deletedAt: Date
}

export interface ImageUrl {
  image_custom: string
  image_cloud: string
}

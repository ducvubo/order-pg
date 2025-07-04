// @generated by protobuf-ts 2.9.4 with parameter long_type_string,optimize_code_size
// @generated from protobuf file "restaurant.proto" (package "RestaurantProto", syntax proto3)
// tslint:disable
import { IBackendGRPC } from "./api";
import { ServiceType } from "@protobuf-ts/runtime-rpc";
import { MessageType } from "@protobuf-ts/runtime";
/**
 * @generated from protobuf message RestaurantProto.ReqFindOneRestaurantById
 */
export interface ReqFindOneRestaurantById {
    /**
     * @generated from protobuf field: string resId = 1;
     */
    resId: string;
}
// @generated message type with reflection information, may provide speed optimized methods
class ReqFindOneRestaurantById$Type extends MessageType<ReqFindOneRestaurantById> {
    constructor() {
        super("RestaurantProto.ReqFindOneRestaurantById", [
            { no: 1, name: "resId", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
}
/**
 * @generated MessageType for protobuf message RestaurantProto.ReqFindOneRestaurantById
 */
export const ReqFindOneRestaurantById = new ReqFindOneRestaurantById$Type();
/**
 * @generated ServiceType for protobuf service RestaurantProto.RestaurantServiceGprc
 */
export const RestaurantServiceGprc = new ServiceType("RestaurantProto.RestaurantServiceGprc", [
    { name: "findOneRestaurantById", options: {}, I: ReqFindOneRestaurantById, O: IBackendGRPC }
]);

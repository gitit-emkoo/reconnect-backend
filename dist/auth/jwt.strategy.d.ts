import { Strategy, StrategyOptionsWithRequest } from 'passport-jwt';
import { Request } from 'express';
declare const JwtStrategy_base: new (...args: [opt: StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    constructor();
    validate(req: Request, payload: any): Promise<Express.User>;
}
export {};

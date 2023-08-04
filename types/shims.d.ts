declare global {
    namespace Express {
        export interface Request {
            username: string;
        }
    }
}

export {};
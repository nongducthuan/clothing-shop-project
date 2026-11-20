export class OrderCreationError extends Error {
    constructor(readonly httpStatus: 400 | 409, message: string) {
        super(message);
        this.name = 'OrderCreationError';
    }
}

export class MinimumOrderValueError extends Error {
    readonly min_order_value: number;

    constructor(minOrderValue: number) {
        super('Minimum order value not met');
        this.name = 'MinimumOrderValueError';
        this.min_order_value = minOrderValue;
    }
}

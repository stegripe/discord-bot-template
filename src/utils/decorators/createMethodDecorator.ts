import { type FunctionType, type MethodDecorator, type Promisable } from "../../typings/index.js";

export function createMethodDecorator<
    Context = unknown,
    Target extends FunctionType = FunctionType,
>(
    func: (...args: Parameters<Target>) => Promisable<boolean | undefined>,
): MethodDecorator<Context, unknown> {
    return (_target: unknown, _: unknown, descriptor: TypedPropertyDescriptor<Target>) => {
        const originalMethod = descriptor.value as Target;

        descriptor.value = async function value(
            this: unknown,
            ...args: Parameters<Target>
        ): Promise<ReturnType<Target> | undefined> {
            const res = await func(...args);
            if (res === false) {
                return undefined;
            }

            return originalMethod.apply(this, args) as ReturnType<Target>;
        } as Target;
    };
}

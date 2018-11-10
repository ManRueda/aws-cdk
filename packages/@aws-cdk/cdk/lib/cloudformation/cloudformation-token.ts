import { Construct } from "../core/construct";
import { ContextMap, resolve, Token } from "../core/tokens";

/**
 * Base class for CloudFormation built-ins
 */
export class CloudFormationToken extends Token {
  public concat(left: any | undefined, right: any | undefined): Token {
    const parts = new Array<any>();
    if (left !== undefined) { parts.push(left); }
    parts.push(resolve(this));
    if (right !== undefined) { parts.push(right); }
    return new FnConcat(...parts);
  }
}

export class StackAwareCloudFormationToken extends CloudFormationToken {
  private readonly tokenStack: Stack;

  constructor(anchor: Construct, value: any, displayName?: string) {
      if (typeof(value) === 'function') {
          throw new Error('StackAwareCloudFormationToken can only contain eager values');
      }
      super(value, displayName);
      this.tokenStack = Stack.find(anchor);
  }

  public freeze(context: ContextMap): Token {
      // tslint:disable-next-line:no-console
      console.log('Freezing me ', context);
      const consumingStack = context.stack;
      if (consumingStack && this.tokenStack !== consumingStack) {
          // We're trying to resolve a cross-stack reference
          consumingStack.addStackDependency(this.tokenStack);
          // tslint:disable-next-line:no-console
          console.log('Freezing!', this);
          return this.tokenStack.exportValue(this, consumingStack);
      }
      // Stack-local resolution
      return this;
  }
}

/**
 * Return whether the given value represents a CloudFormation intrinsic
 */
export function isIntrinsic(x: any) {
  if (Array.isArray(x) || x === null || typeof x !== 'object') { return false; }

  const keys = Object.keys(x);
  if (keys.length !== 1) { return false; }

  return keys[0] === 'Ref' || keys[0].startsWith('Fn::');
}

import { FnConcat } from "./fn";
import { Stack } from "./stack";
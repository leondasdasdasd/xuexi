declare module "react-sortable-hoc" {
  import type { ComponentType, MouseEvent, TouchEvent } from "react";

  export type SortEvent = Event | MouseEvent<unknown> | TouchEvent<unknown>;

  export type SortEventWithTag = SortEvent & {
    target: { tagName: string };
  };

  export interface SortEnd {
    oldIndex: number;
    newIndex: number;
  }

  export interface SortableContainerProps {
    axis?: "x" | "y" | "xy";
    distance?: number;
    helperClass?: string;
    lockAxis?: "x" | "y";
    onSortEnd: (sort: SortEnd) => void;
    onSortStart?: () => void;
    shouldCancelStart?: (event: SortEvent | SortEventWithTag) => boolean;
    useDragHandle?: boolean;
  }

  export interface SortableElementProps {
    index: number;
  }

  export function SortableContainer<P>(
    component: ComponentType<P>,
  ): ComponentType<P & SortableContainerProps>;
  export function SortableElement<P>(
    component: ComponentType<P>,
  ): ComponentType<P & SortableElementProps>;
  export function SortableHandle<P>(
    component: ComponentType<P>,
  ): ComponentType<P>;
}

declare module '@storybook/csf' {
  import {within} from "shadow-dom-testing-library";
  
  type ShadowCanvas = ReturnType<typeof within>;
  
  export interface Canvas extends ShadowCanvas{}
}
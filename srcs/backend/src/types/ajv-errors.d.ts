declare module 'ajv-errors' {
    import type Ajv from 'ajv';
    function ajvErrors(ajv: Ajv): Ajv;
    export default ajvErrors;
  }
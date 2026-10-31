import {defineConfig} from 'vite';
const local={host:'127.0.0.1',port:5174,strictPort:true,proxy:{'/api':{target:'http://127.0.0.1:3001',changeOrigin:false}}};
export default defineConfig({server:local,preview:local});

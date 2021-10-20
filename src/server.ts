import { serverHttp } from "./app";


serverHttp.listen(4000, () =>
    console.log(':rocket Server is running on Port 4000')
);
import axios from "axios";
import prismaClient from "../prisma"
import { sign } from "jsonwebtoken"

/**
 *  Recebe o código
*/

interface IAcesstokenResponse {
    access_token: string
}

interface IUserResponse {
    avatar_url: string,
    login: string,
    id: number,
    name: string
}

class AuthenticateUserService {
    async execute(code: string) {
        /*
        *  Recupera o access_token no github
        */
        const url = "https://github.com/login/oauth/access_token";
        
        const {data: accessTokenResponse} = await axios.post<IAcesstokenResponse>(url, null, {
            params: {
                client_id: process.env.GITHUB_CLIENT_ID,
                client_secret: process.env.GITHUB_CLIENT_SECRET,
                code,
            },
            headers: {
                "Accept": "application/json"
            }
        });

        const response = await axios.get<IUserResponse>("https://api.github.com/user", {
            headers: {
                authorization: `Bearer ${accessTokenResponse.access_token}`
            }
        })

        const { login, id, avatar_url, name } = response.data

        let user = await prismaClient.user.findFirst({
            where: {
                github_id: id
            }
        })

        if(!user) {
            user = await prismaClient.user.create({
                data: {
                    github_id: id,
                    login,
                    avatar_url,
                    name
                }
            })
        }

        const token = sign (
            {
                user: {
                    name: user.name,
                    avatar_ur: user.avatar_url,
                    id: user.id
                }
            },
            String(process.env.JWT_SECRET),
            {
                subject: user.id,
                expiresIn: "1d"
            }
        );
        
        return { token, user };
    }
}

export { AuthenticateUserService }

/*
*  Verifica se o usuário existe no banco de dados
* 
* --- Se existir, vai gerar um token pra ele
* --- Se não existir, cria no banco de dados e gera um token
*/
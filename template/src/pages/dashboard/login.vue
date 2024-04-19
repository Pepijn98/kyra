<template>
    <div class="container">
        <el-container class="innerContainer">
            <Logo class="logo" />
            <el-container class="container-card">
                <el-card class="login-card">
                    <el-form>
                        <el-form-item label="Email:">
                            <el-input class="email" placeholder="Email" v-model="email" type="email" />
                        </el-form-item>
                        <el-form-item label="Password:">
                            <el-input class="password" placeholder="Password" v-model="password" type="password" />
                        </el-form-item>
                        <el-form-item class="actions">
                            <el-button class="login" type="primary" @click="login" plain>Login</el-button>
                            <el-button class="register" @click="login" plain>Register</el-button>
                        </el-form-item>
                    </el-form>
                </el-card>
            </el-container>
        </el-container>
    </div>
</template>

<script setup lang="ts">
import { ElNotification } from "element-plus";

import { isApiResponse } from "~/api/ApiService";
import Logo from "~/components/Logo.vue";

const router = useRouter();
const userStore = useUserStore();
const api = useApi();

const email = ref("");
const password = ref("");

if (userStore.isLoggedIn) {
    router.push(`/dashboard/${userStore.user!.id}/profile`);
}

async function login(): Promise<void> {
    // TODO: Validate email and password.

    const resp = await api.auth.login(email.value, password.value);
    if (isApiResponse(resp)) {
        userStore.addUser(resp.data.user);
        router.push(`/dashboard/${userStore.user!.id}/profile`);
    } else {
        ElNotification({
            title: resp.statusMessage,
            message: resp.message,
            type: "error",
            duration: 5000,
        });
    }
}
</script>

<style lang="scss">
.email, .password {
    > div {
        border-radius: 20px;
    }
}

.actions {
    > div {
        justify-content: center;
    }
}
</style>

<style lang="scss" scoped>
.container {
    height: 100%;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;

    .innerContainer {
        flex-direction: column;

        .logo {
            margin-bottom: 20px;
        }

        .container-card {
            padding-left: 10px;
            padding-right: 10px;
            justify-content: center;

            .login-card {
                width: 600px;
                padding: 20px;
                border-radius: 20px;
                align-self: center;

                .actions {
                    .login, .register {
                        height: 50px;
                        width: 180px;
                        border-radius: 50px;
                    }
                }

                .el-form-item:last-child {
                    margin-bottom: 0;
                }
            }
        }
    }
}
</style>

<route lang="yaml">
meta:
  title: Login
  layout: default
</route>

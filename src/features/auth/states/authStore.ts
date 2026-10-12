import { defineStore } from "pinia";
import authApi from "../api/authApi";
import apiHelper from "../../../helpers/apiHelper";
import {
  getErrorMessage,
  showErrorDialog,
  showSuccessDialog,
} from "../../../helpers/toolsHelper";

export interface AuthState {
  isAuthRegister: boolean;
  isAuthRegistered: boolean;
  isAuthLogin: boolean;
  isAuthLoggedIn: boolean;
  isAuthLogout: boolean;
  isAuthLoggedOut: boolean;
  lastError: string;
}

export const useAuthStore = defineStore("auth", {
  state: (): AuthState => ({
    isAuthRegister: false,
    isAuthRegistered: false,
    isAuthLogin: false,
    isAuthLoggedIn: false,
    isAuthLogout: false,
    isAuthLoggedOut: false,
    lastError: "",
  }),
  actions: {
    setLastError(message: string) {
      this.lastError = message;
    },
    setIsAuthRegister(status: boolean) {
      this.isAuthRegister = status;
    },
    setIsAuthRegistered(status: boolean) {
      this.isAuthRegistered = status;
    },
    setIsAuthLogin(status: boolean) {
      this.isAuthLogin = status;
    },
    setIsAuthLoggedIn(status: boolean) {
      this.isAuthLoggedIn = status;
    },
    setIsAuthLogout(status: boolean) {
      this.isAuthLogout = status;
    },
    setIsAuthLoggedOut(status: boolean) {
      this.isAuthLoggedOut = status;
    },
    async asyncSetIsAuthRegister(name: string, email: string, password: string) {
      try {
        const message = await authApi.postRegister(name, email, password);
        showSuccessDialog(message);
        this.setIsAuthRegistered(true);
      } catch (error: any) {
        showErrorDialog(error.message);
        this.setIsAuthRegistered(false);
      } finally {
        this.setIsAuthRegister(true);
      }
    },
    async asyncSetIsAuthLogin(email: string, password: string) {
      try {
        const result = await authApi.postLogin(email, password);
        apiHelper.putAccessToken(result.token);
        this.setIsAuthLoggedIn(true);
      } catch (error: any) {
        showErrorDialog(error.message);
        this.setIsAuthLoggedIn(false);
      } finally {
        this.setIsAuthLogin(true);
      }
    },
    async asyncSetIsAuthLogout() {
      try {
        await authApi.postLogout();
      } catch (error) {
        // Kegagalan backend dicatat, pembersihan token lokal tetap dilanjutkan
        this.setLastError(getErrorMessage(error));
      } finally {
        apiHelper.putAccessToken("");
        this.setIsAuthLoggedOut(true);
        this.setIsAuthLogout(true);
      }
    },
  },
});

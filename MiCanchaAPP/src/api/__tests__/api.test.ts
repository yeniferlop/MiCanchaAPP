import API from "../api";

describe("Axios API Client & Interceptors (TDD)", () => {
  const originalLocalStorage = global.localStorage;

  beforeEach(() => {
    // Mock localStorage
    const store: Record<string, string> = {};
    const mockLocalStorage = {
      getItem: jest.fn((key: string) => store[key] || null),
      setItem: jest.fn((key: string, value: string) => {
        store[key] = value.toString();
      }),
      removeItem: jest.fn((key: string) => {
        delete store[key];
      }),
      clear: jest.fn(() => {
        Object.keys(store).forEach((key) => delete store[key]);
      }),
    };

    Object.defineProperty(global, "localStorage", {
      value: mockLocalStorage,
      writable: true,
    });
  });

  afterAll(() => {
    Object.defineProperty(global, "localStorage", {
      value: originalLocalStorage,
      writable: true,
    });
  });

  describe("Configuration", () => {
    it("should have baseURL configured to http://localhost:4000/api", () => {
      expect(API.defaults.baseURL).toBe("http://localhost:4000/api");
    });
  });

  describe("Request Interceptor", () => {
    it("should attach Authorization header when token exists in localStorage", async () => {
      // Arrange
      const token = "jwt-valid-token-12345";
      localStorage.setItem("token", token);

      const requestConfig = {
        headers: {} as any,
      };

      // Retrieve registered request interceptor handler
      // @ts-ignore
      const interceptor = API.interceptors.request.handlers[0];

      // Act
      const modifiedConfig = await interceptor.fulfilled(requestConfig);

      // Assert
      expect(localStorage.getItem).toHaveBeenCalledWith("token");
      expect(modifiedConfig.headers.Authorization).toBe(`Bearer ${token}`);
    });

    it("should not attach Authorization header when token is not present in localStorage", async () => {
      // Arrange
      const requestConfig = {
        headers: {} as any,
      };

      // @ts-ignore
      const interceptor = API.interceptors.request.handlers[0];

      // Act
      const modifiedConfig = await interceptor.fulfilled(requestConfig);

      // Assert
      expect(localStorage.getItem).toHaveBeenCalledWith("token");
      expect(modifiedConfig.headers.Authorization).toBeUndefined();
    });

    it("should preserve other headers while injecting Authorization header", async () => {
      // Arrange
      localStorage.setItem("token", "secret-token");
      const requestConfig = {
        headers: {
          "Content-Type": "application/json",
          "X-Custom-Header": "CustomValue",
        } as any,
      };

      // @ts-ignore
      const interceptor = API.interceptors.request.handlers[0];

      // Act
      const modifiedConfig = await interceptor.fulfilled(requestConfig);

      // Assert
      expect(modifiedConfig.headers["Content-Type"]).toBe("application/json");
      expect(modifiedConfig.headers["X-Custom-Header"]).toBe("CustomValue");
      expect(modifiedConfig.headers.Authorization).toBe("Bearer secret-token");
    });
  });
});

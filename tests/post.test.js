import { app, server } from "..";
import request from "supertest";

const token =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFkYXJzaGdrdUBnbWFpbC5jb20iLCJpYXQiOjE3MTQ3NTQxNzB9.jCeGVlTo5scAgiE3CmPbrCTJ_nHqJ4tlCVvIO6uY8cI";

//close express server after all tests
afterAll(() => {
  server.close();
});

describe("POST /post", () => {
  it("should create a new post", async () => {
    const response = await request(app)
      .post("/post")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Test Post",
        content: "This is a test post",
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("id");
    expect(response.body).toHaveProperty("title", "Test Post");
    expect(response.body).toHaveProperty("content", "This is a test post");
    expect(response.body).toHaveProperty("userEmail", "adarshgku@gmail.com");
  });

  it("should return 401 if no token is provided", async () => {
    const response = await request(app).post("/post").send({
      title: "Test Post",
      content: "This is a test post",
    });

    expect(response.status).toBe(401);
  });
});

describe("GET /post", () => {
  it("should return a list of posts", async () => {
    const response = await request(app)
      .get("/post")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it("should return 401 if no token is provided", async () => {
    const response = await request(app).get("/post");

    expect(response.status).toBe(401);
  });
});

import { interpret } from "xstate";
import { MemoryRouter } from "react-router-dom";
import SignUpForm from "./SignUpForm";
import { authMachine } from "../machines/authMachine";
import { SignUpPayload } from "../models";

describe("SignUpForm", () => {
  let authService;
  beforeEach(() => {
    authService = interpret(authMachine);
    authService.start();

    expect(authService.state.value).to.equal("unauthorized");
    cy.intercept("POST", "http://localhost:3001/users", {
      statusCode: 201,
      fixture: "signup-user.json",
    }).as("signupPost");

    cy.mount(
      <MemoryRouter>
        <SignUpForm authService={authService} />
      </MemoryRouter>
    );
  });

  it("disables submit and shows errors for a short password and mismatched confirmPassword", () => {
    cy.get("[data-test*=signup-password] input").type("abc").blur();
    cy.get("#password-helper-text")
      .should("be.visible")
      .and("contain", "Password must contain at least 4 characters");

    cy.get("[data-test*=signup-confirmPassword] input").type("abcd").blur();
    cy.get("#confirmPassword-helper-text")
      .should("be.visible")
      .and("contain", "Password does not match");

    cy.get("[data-test*=signup-submit]").should("be.disabled");
  });

  it("submits the sign up payload to the backend", () => {
    const expectedPayload: SignUpPayload = {
      firstName: "Bob",
      lastName: "Ross",
      username: "PainterJoy90",
      password: "s3cret",
    };

    cy.get("[data-test*=signup-first-name] input").type(expectedPayload.firstName);
    cy.get("[data-test*=signup-last-name] input").type(expectedPayload.lastName);
    cy.get("[data-test*=signup-username] input").type(expectedPayload.username);
    cy.get("[data-test*=signup-password] input").type(expectedPayload.password);
    cy.get("[data-test*=signup-confirmPassword] input").type(expectedPayload.password);
    cy.get("[data-test*=signup-submit]").should("not.be.disabled").click();

    cy.wait("@signupPost").its("request.body").should("deep.include", expectedPayload);
  });
});

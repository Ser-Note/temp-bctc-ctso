const msal = require('@azure/msal-node');
const axios = require('axios');

const { msalConfig } = require('../authConfig');

class AuthProvider {
    msalConfig;
    cryptoProvider;

    constructor(msalConfig) {
        this.msalConfig = msalConfig
        this.cryptoProvider = new msal.CryptoProvider();
    };

    login(options = {}) {
        return async (req, res, next) => {
            console.log('[AUTH] Login initiated');
            try {
                const state = this.cryptoProvider.base64Encode(
                    JSON.stringify({
                        successRedirect: options.successRedirect || '/',
                    })
                );

                const authCodeUrlRequestParams = {
                    state: state,
                    scopes: options.scopes || [],
                    redirectUri: options.redirectUri,
                };

                const authCodeRequestParams = {
                    state: state,
                    scopes: options.scopes || [],
                    redirectUri: options.redirectUri,
                };

                if (!this.msalConfig.auth.cloudDiscoveryMetadata || !this.msalConfig.auth.authorityMetadata) {
                    console.log('[AUTH] Fetching cloud discovery and authority metadata...');
                    const [cloudDiscoveryMetadata, authorityMetadata] = await Promise.all([
                        this.getCloudDiscoveryMetadata(this.msalConfig.auth.authority),
                        this.getAuthorityMetadata(this.msalConfig.auth.authority)
                    ]);

                    this.msalConfig.auth.cloudDiscoveryMetadata = JSON.stringify(cloudDiscoveryMetadata);
                    this.msalConfig.auth.authorityMetadata = JSON.stringify(authorityMetadata);
                    console.log('[AUTH] Metadata loaded successfully');
                }

                const msalInstance = this.getMsalInstance(this.msalConfig);

                // trigger the first leg of auth code flow
                console.log('[AUTH] Redirecting to auth code URL...');
                return this.redirectToAuthCodeUrl(
                    authCodeUrlRequestParams,
                    authCodeRequestParams,
                    msalInstance
                )(req, res, next);
            } catch (error) {
                console.error('[AUTH] Error in login:', error.message);
                next(error);
            }
        };
    }

    acquireToken(options = {}) {
        return async (req, res, next) => {
            try {
                const msalInstance = this.getMsalInstance(this.msalConfig);

                if (req.session.tokenCache) {
                    msalInstance.getTokenCache().deserialize(req.session.tokenCache);
                }

                const tokenResponse = await msalInstance.acquireTokenSilent({
                    account: req.session.account,
                    scopes: options.scopes || [],
                });

                req.session.tokenCache = msalInstance.getTokenCache().serialize();
                req.session.accessToken = tokenResponse.accessToken;
                req.session.idToken = tokenResponse.idToken;
                req.session.account = tokenResponse.account;

                res.redirect(options.successRedirect);
            } catch (error) {
                if (error instanceof msal.InteractionRequiredAuthError) {
                    return this.login({
                        scopes: options.scopes || [],
                        redirectUri: options.redirectUri,
                        successRedirect: options.successRedirect || '/',
                    })(req, res, next);
                }

                next(error);
            }
        };
    }

  handleRedirect = (options = {}) => {
    return async (req, res, next) => {
        console.log('[AUTH] handleRedirect called');
        const data = req.body?.state ? req.body : req.query;
        console.log('[AUTH] Redirect data:', { hasState: !!data?.state, hasCode: !!data?.code });
        
        if (!data || !data.state) {
            console.error('[AUTH] Missing state in redirect');
            return next(new Error('Error: response not found'));
        }

        const authCodeRequest = {
            ...req.session.authCodeRequest,
            code: data.code,
            codeVerifier: req.session.pkceCodes.verifier,
        };

        try {
            console.log('[AUTH] Acquiring token by code...');
            const msalInstance = this.getMsalInstance(this.msalConfig);
            if (req.session.tokenCache) {
                msalInstance.getTokenCache().deserialize(req.session.tokenCache);
            }

            const tokenResponse = await msalInstance.acquireTokenByCode(authCodeRequest, data);
            console.log('[AUTH] Token acquired successfully');

            req.session.tokenCache = msalInstance.getTokenCache().serialize();
            req.session.idToken = tokenResponse.idToken;
            req.session.account = tokenResponse.account;
            req.session.isAuthenticated = true;

            const state = JSON.parse(this.cryptoProvider.base64Decode(data.state));
            console.log('[AUTH] Redirecting to:', state.successRedirect);
            res.redirect(state.successRedirect);
        } catch (error) {
            console.error('[AUTH] Error in handleRedirect:', error.message);
            next(error);
        }
    }
  }



    logout(options = {}) {
        return (req, res, next) => {
            let logoutUri = `${this.msalConfig.auth.authority}/oauth2/v2.0/`;

            if (options.postLogoutRedirectUri) {
                logoutUri += `logout?post_logout_redirect_uri=${options.postLogoutRedirectUri}`;
            }

            req.session.destroy(() => {
                res.redirect(logoutUri);
            });
        }
    }

    /**
     * Instantiates a new MSAL PublicClientApplication object
     * @param msalConfig: MSAL Node Configuration object 
     * @returns 
     */
    getMsalInstance(msalConfig) {
        return new msal.PublicClientApplication(msalConfig);
    }

    redirectToAuthCodeUrl(authCodeUrlRequestParams, authCodeRequestParams, msalInstance) {
        return async (req, res, next) => {
            // Generate PKCE Codes before starting the authorization flow
            const { verifier, challenge } = await this.cryptoProvider.generatePkceCodes();

            // Set generated PKCE codes and method as session vars
            req.session.pkceCodes = {
                challengeMethod: 'S256',
                verifier: verifier,
                challenge: challenge,
            };

            req.session.authCodeUrlRequest = {
                ...authCodeUrlRequestParams,
                responseMode: msal.ResponseMode.FORM_POST,
                codeChallenge: req.session.pkceCodes.challenge,
                codeChallengeMethod: req.session.pkceCodes.challengeMethod,
            };

            req.session.authCodeRequest = {
                ...authCodeRequestParams,
                code: '',
            };

            try {
                const authCodeUrlResponse = await msalInstance.getAuthCodeUrl(req.session.authCodeUrlRequest);
                res.redirect(authCodeUrlResponse);
            } catch (error) {
                next(error);
            }
        };
    }

    async getCloudDiscoveryMetadata(authority) {
        const endpoint = 'https://login.microsoftonline.com/common/discovery/instance';

        try {
            const response = await axios.get(endpoint, {
                params: {
                    'api-version': '1.1',
                    'authorization_endpoint': `${authority}/oauth2/v2.0/authorize`
                }
            });

            return await response.data;
        } catch (error) {
            throw error;
        }
    }

    async getAuthorityMetadata(authority) {
        const endpoint = `${authority}/v2.0/.well-known/openid-configuration`;

        try {
            const response = await axios.get(endpoint);
            return await response.data;
        } catch (error) {
            console.log(error);
        }
    }
}

const authProvider = new AuthProvider(msalConfig);

module.exports = authProvider;
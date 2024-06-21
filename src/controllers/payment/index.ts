import { Request, Response } from "express";
import * as path from "path";
import config from "../../../config";
var fs = require("fs");
var request = require("request");
require("request-debug")(request);
class PaymentController {
    static getSession = async (req: Request, res: Response) => {
        var SERVER =
            config.environment == "staging"
                ? `${process.env.API_URL_STAGING}/api`
                : config.environment == "staging-info"
                ? process.env.API_URL_STAGING_info
                : `${process.env.API_URL}/api`;
        // if(!process.env["NODE_ENV"] || process.env["NODE_ENV"] ==="development") SERVER=`http://localhost:${process.env.port}/api`
        const DOMAIN = <string>req.body.url;
        const CURRENCY = <string>req.body.currency;
        const AMOUNT = req.body.amount;
        const PAYMENT_CODE = req.body.payment_code;
        const ORDER_ID = req.body.order_id;
        const ORDER_REFERENCE = req.body.order_reference;
        const ADJUSTMENT_FLAG = req.body.adjustment_flag;
        var resultIndicator = null;
        var result = "ERROR";
        if (!DOMAIN || !CURRENCY || !AMOUNT) res.status(400).send();

        var requestData = {
            apiOperation: "CREATE_CHECKOUT_SESSION",
            order: {
                currency: CURRENCY,
                id: ORDER_ID,
                amount: AMOUNT,
                reference: ORDER_REFERENCE,
            },
        };

        var auth = {
            user:
                config.environment == "staging"
                    ? process.env.PAYEMNT_USER_STAGING
                    : process.env.PAYEMNT_USER,
            pass:
                config.environment == "staging"
                    ? process.env.PASSWORD_STAGING
                    : process.env.PASSWORD,
        };
        var url = `${process.env.BASEURL}/api/rest/version/${
            process.env.VERSION
        }/merchant/${
            config.environment == "staging"
                ? process.env.MERCHANR_ID_STAGING
                : process.env.MERCHANR_ID
        }/session`;
        var options = {
            url: url,
            method: "POST",
            json: requestData,
            auth: auth,
        };
        try {
            request(options, function (error, response, body) {
                if (error) {
                    res.status(500).send({
                        CREATE_CHECKOUT_SESSION_STATUS: "FAILD",
                        ERROR: error,
                    });
                }
                if (!body.session || !body.session.id) return;
                var SESSION_ID = body.session.id;
                var payment = `<!DOCTYPE html>
                <html>
                <head>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
                <style>
                body {
                  font-family: Arial;
                  font-size: 17px;
                  padding: 8px;
                }
                * {
                  box-sizing: border-box;
                }
                
                .row {
                  display: -ms-flexbox; /* IE10 */
                  display: flex;
                  -ms-flex-wrap: wrap; /* IE10 */
                  flex-wrap: wrap;
                  margin: 0 -16px;
                }
                
                .col-25 {
                  -ms-flex: 25%; /* IE10 */
                  flex: 25%;
                }
                
                .col-50 {
                  -ms-flex: 50%; /* IE10 */
                  flex: 50%;
                }
                
                .col-75 {
                  -ms-flex: 75%; /* IE10 */
                  flex: 75%;
                }
                
                .col-25,
                .col-50,
                .col-75 {
                  padding: 0 16px;
                }
                
                .container {
                  background-color: #f2f2f2;
                  padding: 5px 20px 15px 20px;
                  border: 1px solid lightgrey;
                  border-radius: 3px;
                }
                
                input[type=text] {
                  width: 100%;
                  margin-bottom: 20px;
                  padding: 12px;
                  border: 1px solid #ccc;
                  border-radius: 3px;
                }
                
                label {
                  margin-bottom: 10px;
                  display: block;
                }
                
                .icon-container {
                  margin-bottom: 20px;
                  padding: 7px 0;
                  font-size: 24px;
                }
                .btn {
                  background-color: #04AA6D;
                  color: white;
                  padding: 12px;
                  margin: 10px 0;
                  border: none;
                  width: 100%;
                  border-radius: 3px;
                  cursor: pointer;
                  font-size: 17px;
                }
                
                .btn:hover {
                  background-color: #45a049;
                }
                
                a {
                  color: #2196F3;
                }
                
                hr {
                  border: 1px solid lightgrey;
                }
                
                span.price {
                  float: right;
                  color: grey;
                }
                
                /* Responsive layout - when the screen is less than 800px wide, make the two columns stack on top of each other instead of next to each other (also change the direction - make the "cart" column go on top) */
                @media (max-width: 800px) {
                  .row {
                    flex-direction: column-reverse;
                  }
                  .col-25 {
                    margin-bottom: 20px;
                  }
                }
                </style>
                <script src="${process.env.BASEURL}/checkout/version/${
                    process.env.VERSION
                }/checkout.js"
                data-error="errorCallback"
                data-cancel="cancelCallback"
                data-complete="completeCallback"
                data-beforeRedirect="Checkout.saveFormFields"
                data-afterRedirect="afterRedirect"
                >
        </script>
<script type="application/javascript">
var  successIndicator = "${body.successIndicator}";
    function errorCallback(error) {
      console.log(JSON.stringify(error));
      window.location.href = "${DOMAIN}/services-form/paymentstatus?status=error";
    }
    function cancelCallback() {
      window.location.href = "${DOMAIN}/services-form/requests-list";
          console.log('Payment cancelled');
    }
    function completeCallback(response) {
      resultIndicator = response;
    
     var result = (resultIndicator === successIndicator) ? "SUCCESS" : "ERROR";
     window.location.href = "${DOMAIN}/services-form/payment-confirm/"+result+"";
     
    }
    function beforeRedirect(resultIndicator, sessionVersion) {

      return {
        successIndicator: successIndicator,
        orderId: orderId
       }

    }
    function afterRedirect(data) {
      if (resultIndicator) {
     var result = (resultIndicator === data.successIndicator) ? "SUCCESS" : "ERROR";
     window.location.href = "${DOMAIN}/services-form/payment-confirm/"+result+"";
      }
    }

    Checkout.configure({
        merchant: "${
            config.environment == "staging"
                ? process.env.MERCHANR_ID_STAGING
                : process.env.MERCHANR_ID
        }",
        session: {
        id:"${SESSION_ID}"
    },
 order: {
     amount: "${AMOUNT}",
     currency: "${CURRENCY}",
     description: "Certificate Of Origins & Attestation",
     id: "${ORDER_ID}",
        },
        interaction: {
            merchant: {
                logo:"${process.env.LOGO}",
                email: "${process.env.EMAIL}",
                 name: "${process.env.NAME}",
                phone: "${process.env.PHONE}",
                address: {
                    line1: "${process.env.ADDRESS_LINE1}",
                    line2: "${process.env.ADDRESS_LINE2}"           
                }, 
            }
          }
    });
</script>
                </head>
                <body>
                          <div class="col-50">
                            <h3>Payment</h3>
                            <label for="fname">Accepted Cards</label>
                            <div class="icon-container">
                            <i class="fa fa-cc-visa" style="color:navy;"></i>
                              <i class="fa fa-cc-mastercard" style="color:red;"></i>
                            </div>
                            <label for="expmonth">Amount</label>
                            <input type="text" id="expmonth" name="amount" value="${AMOUNT}" readOnly>
                            <div class="row">
                              <div class="col-50">
                                <label for="expyear">Currency</label>
                                <input type="text" id="expyear" name="currency" value="${CURRENCY}" readOnly>
                              </div>
                            </div>
                          </div>
                        </div>
                        <label>
                        <input class="btn" type="button" value="Continue to checkout" onclick="Checkout.showLightbox();" >
                      </form>
                    </div>
                  </div>
                </div>
                </body>
                </html>
                `;
                fs.writeFileSync(
                    path.join(__dirname, "/payment.html"),
                    payment,
                    (error) => {
                        res.status(500).send(error);
                    }
                );
                res.status(200).send({ server_url: SERVER, html: payment });
            });
        } catch (error) {
            res.status(500).send("something  wrong");
        }
    };

    static checkout = async (req: Request, res: Response) => {
        res.sendFile(path.join(__dirname, "/payment.html"));
    };
}

export default PaymentController;

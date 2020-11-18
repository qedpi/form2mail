const getHeaderRow = sheet => sheet.getRange(1, 1, 1, sheet.getLastColumn())

const sendEmail = () => {
    /**
     *
     * @type {string}
     */
    // tweak here!
    const SHEET_NAME = 'Form Responses 1'
    const SUBJECT = 'Mock Interview Feedback'
    const EMAIL_FIELD = 'Student Email'
    const CONDITION = 'Recommend for referral? (Would the student pass a real interview?)'
    const CONDITIONAL_MESSAGE = {'Yes': "congrats, you'll get referrals", 'No': "sadly no"}
    const NAME_FIELD = 'Student Name'

    const SEND_INFO = ['What did the interviewee do well?', 'How can the interviewee improve?']
    // end tweak

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME)
    const lastRow = sheet.getLastRow();
    const lastColumn = sheet.getLastColumn();

    // Email template & fields
    const htmlTemplate = HtmlService.createTemplateFromFile("mail_template");

    // convert first row to array of strings (keys), filter out empty headers
    const headers = getHeaderRow(sheet).getValues().flat().filter(Boolean)

//    Logger.log(`groups are: ${JSON.stringify(groups)}`)
    //  for each subsequent row, create objects with key-val pairs
    for (const row of sheet.getRange(2, 1, lastRow - 1, lastColumn).getValues()) {
        // for each person, create a map of the headers and the responses
        const response = Object.fromEntries(headers.map((header, i) => [header, row[i]]))
        // check if row passes CONDITION (eg if recommended for referral)
        // extract groups of response categories
        const categories = {}
        for (const [header, v] of Object.entries(response)) {
            if (header.includes('[')) {
                // category name
                const groupName = header.slice(0, header.indexOf('[')).trimEnd()
                Logger.log(groupName)
                // todo: use Map instead of JSON
                if (!categories.hasOwnProperty(groupName)) {
                    categories[groupName] = {}
                }
                // append sub-item to group: todo: either regex or split by regex
                categories[groupName][header.slice(header.indexOf('[') + 1, header.indexOf(']'))] = v
            }
        }
        const extras = {}
        SEND_INFO.map(s => extras[s] = response[s])

        // pass email data to template
        const firstName = response[NAME_FIELD].split(' ')[0]
        htmlTemplate.data = {categories, extras, referral: response[CONDITION], firstName}
        const htmlBody = htmlTemplate.evaluate().getContent()

        // send email!
        MailApp.sendEmail({
            to: response[EMAIL_FIELD],
            cc: 'junruihu@gmail.com',
            subject: SUBJECT,
            htmlBody: htmlBody,
        });
    }
}
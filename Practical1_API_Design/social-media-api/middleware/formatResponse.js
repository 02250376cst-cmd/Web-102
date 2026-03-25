const formatResponse = (req, res, next) => {
    const originalJson = res.json;

    res.json = (data) => {
        const acceptHeader = req.headers.accept;

        if (acceptHeader && acceptHeader.includes('application/xml')) {

            const convertToXml = (obj) => {
                let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<response>\n';

                for (const key in obj) {
                    if (Array.isArray(obj[key])) {
                        xml += ` <${key}>\n`;

                        obj[key].forEach(item => {
                            xml += '  <item>\n';

                            for (const itemKey in item) {
                                xml += `   <${itemKey}>${item[itemKey]}</${itemKey}>\n`;
                            }

                            xml += '  </item>\n';
                        });

                        xml += ` </${key}>\n`;

                    } else if (typeof obj[key] === 'object' && obj[key] !== null) {

                        xml += ` <${key}>\n`;

                        for (const nestedKey in obj[key]) {
                            xml += `   <${nestedKey}>${obj[key][nestedKey]}</${nestedKey}>\n`;
                        }

                        xml += ` </${key}>\n`;

                    } else {
                        xml += ` <${key}>${obj[key]}</${key}>\n`;
                    }
                }

                xml += '</response>';
                return xml;
            };

            res.set('Content-Type', 'application/xml');
            return res.send(convertToXml(data));

        } else {
            res.set('Content-Type', 'application/json');
            return originalJson.call(res, data);
        }
    };

    next();
};

module.exports = formatResponse;
//
// This file was generated by the JavaTM Architecture for XML Binding(JAXB) Reference Implementation, v2.2.7 
// See <a href="http://java.sun.com/xml/jaxb">http://java.sun.com/xml/jaxb</a> 
// Any modifications to this file will be lost upon recompilation of the source schema. 
// Generated on: 2014.09.26 at 10:14:53 AM PDT 
//


package parsers.medline;

import javax.xml.bind.annotation.*;


/**
 * 
 */
@XmlAccessorType(XmlAccessType.FIELD)
@XmlType(name = "", propOrder = {
    "country",
    "medlineTA",
    "nlmUniqueID",
    "issnLinking"
})
@XmlRootElement(name = "MedlineJournalInfo")
public class MedlineJournalInfo {

    @XmlElement(name = "Country")
    protected String country;
    @XmlElement(name = "MedlineTA", required = true)
    protected String medlineTA;
    @XmlElement(name = "NlmUniqueID")
    protected String nlmUniqueID;
    @XmlElement(name = "ISSNLinking")
    protected String issnLinking;

    /**
     * Gets the value of the country property.
     * 
     * @return
     *     possible object is
     *     {@link String }
     *     
     */
    public String getCountry() {
        return country;
    }

    /**
     * Sets the value of the country property.
     * 
     * @param value
     *     allowed object is
     *     {@link String }
     *     
     */
    public void setCountry(String value) {
        this.country = value;
    }

    /**
     * Gets the value of the medlineTA property.
     * 
     * @return
     *     possible object is
     *     {@link String }
     *     
     */
    public String getMedlineTA() {
        return medlineTA;
    }

    /**
     * Sets the value of the medlineTA property.
     * 
     * @param value
     *     allowed object is
     *     {@link String }
     *     
     */
    public void setMedlineTA(String value) {
        this.medlineTA = value;
    }

    /**
     * Gets the value of the nlmUniqueID property.
     * 
     * @return
     *     possible object is
     *     {@link String }
     *     
     */
    public String getNlmUniqueID() {
        return nlmUniqueID;
    }

    /**
     * Sets the value of the nlmUniqueID property.
     * 
     * @param value
     *     allowed object is
     *     {@link String }
     *     
     */
    public void setNlmUniqueID(String value) {
        this.nlmUniqueID = value;
    }

    /**
     * Gets the value of the issnLinking property.
     * 
     * @return
     *     possible object is
     *     {@link String }
     *     
     */
    public String getISSNLinking() {
        return issnLinking;
    }

    /**
     * Sets the value of the issnLinking property.
     * 
     * @param value
     *     allowed object is
     *     {@link String }
     *     
     */
    public void setISSNLinking(String value) {
        this.issnLinking = value;
    }

}

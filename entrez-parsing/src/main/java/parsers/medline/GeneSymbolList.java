//
// This file was generated by the JavaTM Architecture for XML Binding(JAXB) Reference Implementation, v2.2.7 
// See <a href="http://java.sun.com/xml/jaxb">http://java.sun.com/xml/jaxb</a> 
// Any modifications to this file will be lost upon recompilation of the source schema. 
// Generated on: 2014.09.26 at 10:14:53 AM PDT 
//


package parsers.medline;

import javax.xml.bind.annotation.*;
import java.util.ArrayList;
import java.util.List;


/**
 * 
 */
@XmlAccessorType(XmlAccessType.FIELD)
@XmlType(name = "", propOrder = {
    "geneSymbol"
})
@XmlRootElement(name = "GeneSymbolList")
public class GeneSymbolList {

    @XmlElement(name = "GeneSymbol", required = true)
    protected List<GeneSymbol> geneSymbol;

    /**
     * Gets the value of the geneSymbol property.
     *
     * <p>
     * This accessor method returns a reference to the live list,
     * not a snapshot. Therefore any modification you make to the
     * returned list will be present inside the JAXB object.
     * This is why there is not a <CODE>set</CODE> method for the geneSymbol property.
     *
     * <p>
     * For example, to add a new item, do as follows:
     * <pre>
     *    getGeneSymbol().add(newItem);
     * </pre>
     *
     *
     * <p>
     * Objects of the following type(s) are allowed in the list
     * {@link GeneSymbol }
     *
     *
     */
    public List<GeneSymbol> getGeneSymbol() {
        if (geneSymbol == null) {
            geneSymbol = new ArrayList<GeneSymbol>();
        }
        return this.geneSymbol;
    }

}

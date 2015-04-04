package parsers.medline;

import org.junit.Test;

import static org.junit.Assert.*;

public class DateCreatedTest {
    @Test
    public void testConvertDate() throws Exception {
        Year year = new Year();
        Month month = new Month();
        Day day = new Day();
        year.setvalue("2000");
        month.setvalue("1");
        day.setvalue("1");
    }
}
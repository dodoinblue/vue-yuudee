import io.appium.java_client.AppiumDriver;
import io.appium.java_client.MultiTouchAction;
import io.appium.java_client.TouchAction;
import io.appium.java_client.android.AndroidDriver;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.net.URL;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.*;

import org.apache.commons.io.FileUtils;
import org.apache.commons.codec.binary.Base64;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.OutputType;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.remote.DesiredCapabilities;
import org.openqa.selenium.support.ui.ExpectedCondition;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

// Aliyun test. with Appium and JDK 6
public class Main {  
    private AppiumDriver<WebElement> driver;
    private static final boolean takeScreenshot = false;
   
    @Before  
    public void setUp() throws Exception {  
        // set up appium 
        DesiredCapabilities capabilities =  Capabilities.getCapabilities();
        driver = new AndroidDriver<WebElement>(new URL(Capabilities.getUrl()), capabilities);
    }  
   
    @After  
    public void tearDown() throws Exception {  
        driver.quit();  
    }


    @Test
    public void uiWalkThrough() {
        waitForElementBy(By.className("android.webkit.WebView"), 5);
        takeScreenshot();
        waitForElementBy(By.id("English")).click();
        takeScreenshot();
        waitForElementBy(By.id("Confirm"), 50).click();
        takeScreenshot();
        // Swipes
        wait(500);
        swipeLeft();
        swipeLeft();
        swipeLeft();
        swipeRight();
        swipeLeft();
        swipeLeft();
        swipeLeft();
        swipeLeft();
        swipeLeft();
        swipeLeft();
        swipeRight();
        swipeRight();
        swipeRight();
        swipeRight();
        swipeRight();
        swipeRight();
        swipeRight();

        // Click card
        clickByCoordinatesPercentage(0.25f, 0.35f);
        wait(500);
        takeScreenshot();
        clickByCoordinatesPercentage(0.25f, 0.65f);
        wait(1000);
        takeScreenshot();
        wait(6000);
        swipeLeft();
        clickByCoordinatesPercentage(0.25f, 0.35f);
        wait(500);
        takeScreenshot();
        clickByCoordinatesPercentage(0.25f, 0.65f);
        wait(7000);

        // Edit mode
        multiTouchEnterEditMode();
        takeScreenshot();

        // Change courseware
        waitForElementBy(By.id("All")).click();
        takeScreenshot();
        clickCourseListItem();
        wait(500);
        swipeLeft();
        swipeLeft();
        swipeLeft();
        swipeRight();
        swipeLeft();
        swipeLeft();

        // Settings
        waitForElementBy(By.id("Settings")).click();
        takeScreenshot();
        waitForElementBy(By.id("Cancel")).click();

        // Change layout
        waitForElementBy(By.id("Settings")).click();
        waitForElementBy(By.id("parent_settingspop_layout1_1")).click();
        waitForElementBy(By.id("Confirm")).click();
        takeScreenshot();
        wait(500);
        swipeLeft();
        swipeLeft();
        swipeLeft();
        swipeLeft();
        swipeLeft();
        swipeRight();

        waitForElementBy(By.id("Settings")).click();
        waitForElementBy(By.id("parent_settingspop_layout2_2")).click();
        waitForElementBy(By.id("Confirm")).click();

        // New courseware
        waitForElementBy(By.id("New")).click();
        waitForElementBy(By.className("android.widget.EditText")).sendKeys("abc123");
        driver.hideKeyboard();
        takeScreenshot();
        waitForElementBy(By.id("Confirm")).click();

        // Pick
        wait(1000);
        clickByCoordinatesPercentage(0.25f, 0.35f);
        takeScreenshot();
        waitForElementBy(By.id("Back")).click();

        // Library
        waitForElementBy(By.id("Library")).click();
        takeScreenshot();
        wait(500);
        swipeLeft();
        swipeLeft();
        swipeLeft();
        swipeRight();
        swipeRight();
        swipeLeft();
        swipeLeft();

        clickByCoordinatesPercentage(0.25f, 0.65f);
        clickByCoordinatesPercentage(0.25f, 0.65f);

        // New category
        waitForElementBy(By.id("New")).click();
        wait(500);
        clickNewCategoryPopoverItem();
        wait(1500);
//        waitForElementBy(By.className("android.widget.EditText")).sendKeys("category");
//        driver.hideKeyboard();
        takeScreenshot();
        waitForElementBy(By.id("Cancel")).click();

        // New card
        waitForElementBy(By.id("New")).click();
        wait(500);
        clickNewCardPopoverItem();
        wait(1500);
//        waitForElementBy(By.className("android.widget.EditText")).sendKeys("card");
//        driver.hideKeyboard();
        takeScreenshot();
        waitForElementBy(By.id("Cancel")).click();

        // Back
        waitForElementBy(By.id("Back")).click();

        // Change courseware again
        clickByCoordinatesPercentage(0.5f, 0.03f);
        clickCourseListItem();

        // Exit edit mode
        waitForElementBy(By.id("Done")).click();

        // Swipes again
        wait(500);
        swipeLeft();
        swipeLeft();
        swipeLeft();
        swipeRight();
        swipeRight();
        swipeLeft();
        swipeLeft();

//        randomClicks(100, 200);
    }


    private void wait(int ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }

    private WebElement waitForElementBy(By method) {
        return waitForElementBy(method, 5);
    }

    private WebElement waitForElementBy(By method, int seconds) {
        List<WebElement> list = (new WebDriverWait(driver, seconds)).
                until(ExpectedConditions.visibilityOfAllElementsLocatedBy(method));
        System.out.println("Found " + list.size() + " element(s)");
        if(list != null && list.size() > 0) {
            return list.get(0);
        } else {
            throw new RuntimeException("Element not found in " + seconds + " seconds");
        }
    }

    private void multiTouchEnterEditMode() {
        int height = driver.manage().window().getSize().getHeight();
        int width = driver.manage().window().getSize().getWidth();
        System.out.println("height: " + height + " width: " + width);
        MultiTouchAction multiTouch = new MultiTouchAction(driver);

        // int[x, y]
        ArrayList<int[]> coordinates = new ArrayList<int[]>();
        coordinates.add(new int[]{10, 10});
        coordinates.add(new int[]{width - 10, 10});
        coordinates.add(new int[]{width - 10, height - 10});

        for (int i = 0; i < 3; i++) {
            TouchAction tap = new TouchAction(driver);
            multiTouch.add(tap.press(coordinates.get(i)[0], coordinates.get(i)[1]).waitAction(100).release());
        }

        multiTouch.perform();
    }

    private void clickByCoordinatesPercentage(float xpercent, float ypercent) {
        // Popovers are reporting wrong coordinates. Use estimated coordinates instead
        int width = driver.manage().window().getSize().getWidth();
        int height = driver.manage().window().getSize().getHeight();
        wait(500);
        driver.tap(1, (int) (width * xpercent), (int) (height * ypercent), 100);
    }

    private void clickCourseListItem() {
        clickByCoordinatesPercentage(0.5f, 0.24f);
    }

    private void clickNewCardPopoverItem() {
        clickByCoordinatesPercentage(0.9f, 0.12f);
    }

    private void clickNewCategoryPopoverItem() {
        clickByCoordinatesPercentage(0.9f, 0.19f);
    }

    private void swipeLeft() {
        int height = driver.manage().window().getSize().getHeight();
        int width = driver.manage().window().getSize().getWidth();
        TouchAction swipe = new TouchAction(driver).press(width * 8 / 10, height / 2)
                .waitAction(100).moveTo(width * 2 / 10, height / 2).release();
        swipe.perform();
        wait(500);
    }

    private void swipeRight() {
        int height = driver.manage().window().getSize().getHeight();
        int width = driver.manage().window().getSize().getWidth();
        TouchAction swipe = new TouchAction(driver).press(width * 2 / 10, height / 2)
                .waitAction(100).moveTo(width * 8 / 10, height / 2).release();
        swipe.perform();
        wait(500);
    }

    private void takeScreenshot() {
        if(!takeScreenshot) return;
        String screenshootB64 = driver.getScreenshotAs(OutputType.BASE64);
        byte[] data = Base64.decodeBase64(screenshootB64);
        try {
            String destDir = "screenshots";
            File scrFile = File.createTempFile("screenshot", ".png");
            scrFile.deleteOnExit();
            try (OutputStream stream = new FileOutputStream(scrFile)) {
                stream.write(data);
            }
            DateFormat dateFormat = new SimpleDateFormat("yyyy-MMM-dd__hh_mm_ssaa");
            String destFile = dateFormat.format(new Date()) + ".png";

            // To create folder to store screenshots
            new File(destDir).mkdirs();
            // Set file name with combination of test class name + date time.
            System.out.println(destFile);
            // Store file at destination folder location
            FileUtils.copyFile(scrFile, new File(destDir + "/" + destFile));
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    private void randomClicks(int numOfClicks, int intterval) {
        int height = driver.manage().window().getSize().getHeight();
        int width = driver.manage().window().getSize().getWidth();
        Random r = new Random();
        for(int i= 0; i <= numOfClicks; i++) {
            TouchAction tap = new TouchAction(driver).tap(r.nextInt(width), r.nextInt(height)).waitAction(75).release();
            wait(intterval);
        }
    }
}  

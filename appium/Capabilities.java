import org.openqa.selenium.remote.DesiredCapabilities;

public class Capabilities {	   
	    public static DesiredCapabilities getCapabilities()  {  
	        // set up appium 
	        DesiredCapabilities capabilities = new DesiredCapabilities();  
	        capabilities.setCapability("platformName", "Android");  
	        capabilities.setCapability("deviceName","8d5197aa");
	        capabilities.setCapability("platformVersion", "5.1.1");
	        capabilities.setCapability("app", "/Users/charles.liu/Downloads/yuudee-release-1.3.1.apk");
	        capabilities.setCapability("appPackage", "com.supersuperstar.yuudee.vue");
	        capabilities.setCapability("automationName", "Appium");	       

	        return capabilities;
	    }
	    
	    public static String getUrl(){
	    	return "http://127.0.0.1:4723/wd/hub";
	    }
	    
	    public String getUserName(){
	    	return "%username%";
	    }
	    
	    public String getPassWord(){
	    	return "%password%";
	    }    
}

<?php
class News extends CI_Controller
{	
	public function __construct()
	{
		parent::__construct();
	}
	
	public function index()
	{
		$this->accueil();
	}

	public function accueil()
	{
		$this->load->view('vue');
	}
}